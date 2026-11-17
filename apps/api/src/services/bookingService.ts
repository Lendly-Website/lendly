import { Booking } from "../models/Booking.js";
import { BorrowRequest } from "../models/BorrowRequest.js";
import { Item } from "../models/Item.js";
import { AppError } from "../utils/AppError.js";
import { daysInclusive } from "../utils/dates.js";
import { withKeyLock } from "../utils/locks.js";
import { createNotification } from "./notificationService.js";

export interface AvailabilityResult {
  availableQuantity: number;
  bookedQuantity: number;
}

export async function getAvailability(
  item: { _id: unknown; totalQuantity: number },
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string,
): Promise<AvailabilityResult> {
  const bookings = await Booking.find({
    itemId: item._id,
    bookingStatus: { $nin: ["cancelled"] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  }).select("quantity");

  const bookedQuantity = bookings.reduce((total, booking) => total + booking.quantity, 0);
  return {
    bookedQuantity,
    availableQuantity: Math.max(0, item.totalQuantity - bookedQuantity),
  };
}

export function isWithinAvailability(
  item: { availability: Array<{ startDate: Date; endDate: Date }> },
  startDate: Date,
  endDate: Date,
): boolean {
  return item.availability.some(
    (window) => window.startDate <= startDate && window.endDate >= endDate,
  );
}

export async function acceptBorrowRequest(
  requestId: string,
  lenderId: string,
): Promise<any> {
  const initialRequest = await BorrowRequest.findById(requestId);
  if (!initialRequest) throw new AppError(404, "Borrowing request not found");

  return withKeyLock(String(initialRequest.itemId), async () => {
    const request = await BorrowRequest.findById(requestId);
    if (!request) throw new AppError(404, "Borrowing request not found");
    if (String(request.lenderId) !== lenderId) {
      throw new AppError(403, "Only the lender can accept this request");
    }
    if (request.requestStatus !== "pending") {
      throw new AppError(409, "This request has already been processed");
    }

    const item = await Item.findById(request.itemId);
    if (!item) throw new AppError(404, "Item not found");
    if (item.listingStatus !== "active") {
      throw new AppError(409, "This listing is not currently active");
    }
    if (!isWithinAvailability(item, request.startDate, request.endDate)) {
      throw new AppError(409, "The requested dates are outside the listing availability");
    }

    const availability = await getAvailability(item, request.startDate, request.endDate);
    if (request.requestedQuantity > availability.availableQuantity) {
      throw new AppError(
        409,
        `Only ${availability.availableQuantity} unit(s) are available for these dates`,
        { availableQuantity: availability.availableQuantity },
        "INSUFFICIENT_INVENTORY",
      );
    }

    const rentalAmount =
      daysInclusive(request.startDate, request.endDate) * item.rentalPrice * request.requestedQuantity;

    const booking = (await Booking.create({
      requestId: request._id,
      itemId: item._id,
      borrowerId: request.borrowerId,
      lenderId: request.lenderId,
      quantity: request.requestedQuantity,
      startDate: request.startDate,
      endDate: request.endDate,
      rentalAmount,
      bookingStatus: "confirmed",
      handoverStatus: "pending",
      returnStatus: "pending",
    }));

    request.requestStatus = "accepted";
    request.bookingId = booking._id;
    await request.save();

    await createNotification({
      userId: String(request.borrowerId),
      notificationType: "booking_confirmed",
      message: `Your request for ${item.itemName} was accepted. Booking ${String(booking._id)} is confirmed.`,
      relatedBookingId: String(booking._id),
      relatedRequestId: String(request._id),
    });

    return booking;
  });
}
