import { Router } from "express";
import { bookingActionSchema } from "@lendly/shared";
import { Booking } from "../models/Booking.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../services/notificationService.js";
import { participantIds } from "../utils/participants.js";

const router = Router();

const userPopulation = "name profileImage verificationStatus averageRating reviewCount";

router.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const bookings = await Booking.find({
      $or: [
        { borrowerId: request.user!.userId },
        { lenderId: request.user!.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("itemId", "itemName images category")
      .populate("borrowerId", userPopulation)
      .populate("lenderId", userPopulation);
    response.json({ data: bookings });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const booking = await Booking.findById(request.params.id)
      .populate("itemId", "itemName images category")
      .populate("borrowerId", userPopulation)
      .populate("lenderId", userPopulation);
    if (!booking) throw new AppError(404, "Booking not found");

    if (!participantIds(booking).includes(request.user!.userId)) {
      throw new AppError(403, "You do not have access to this booking");
    }
    response.json({ data: booking });
  }),
);

router.patch(
  "/:id/handover",
  requireAuth,
  validateBody(bookingActionSchema),
  asyncHandler(async (request, response) => {
    const booking = await Booking.findById(request.params.id);
    if (!booking) throw new AppError(404, "Booking not found");

    if (!participantIds(booking).includes(request.user!.userId)) {
      throw new AppError(403, "You do not have access to this booking");
    }
    if (booking.handoverStatus !== "pending") {
      throw new AppError(409, "Handover has already been confirmed");
    }
    if (booking.bookingStatus !== "confirmed") {
      throw new AppError(409, "This booking is not ready for handover");
    }

    const { initialCondition } = request.body as { initialCondition?: string };
    booking.handoverStatus = "confirmed";
    booking.bookingStatus = "active";
    booking.handoverAt = new Date();
    booking.initialCondition = initialCondition ?? "Recorded at handover";
    await booking.save();

    const recipient =
      request.user!.userId === String(booking.borrowerId)
        ? booking.lenderId
        : booking.borrowerId;
    await createNotification({
      userId: String(recipient),
      notificationType: "booking_confirmed",
      message: "Item handover has been confirmed. The borrowing is now active.",
      relatedBookingId: String(booking._id),
    });
    response.json({ data: booking });
  }),
);

router.patch(
  "/:id/return",
  requireAuth,
  validateBody(bookingActionSchema),
  asyncHandler(async (request, response) => {
    const booking = await Booking.findById(request.params.id);
    if (!booking) throw new AppError(404, "Booking not found");

    if (!participantIds(booking).includes(request.user!.userId)) {
      throw new AppError(403, "You do not have access to this booking");
    }
    if (booking.returnStatus !== "pending") {
      throw new AppError(409, "Item return has already been confirmed");
    }
    if (booking.handoverStatus !== "confirmed") {
      throw new AppError(409, "Item handover must be confirmed before return");
    }

    const { finalCondition } = request.body as { finalCondition?: string };
    booking.returnStatus = "confirmed";
    booking.bookingStatus = "returned";
    booking.returnedAt = new Date();
    booking.finalCondition = finalCondition ?? "Returned";
    await booking.save();

    const recipient =
      request.user!.userId === String(booking.borrowerId)
        ? booking.lenderId
        : booking.borrowerId;
    await createNotification({
      userId: String(recipient),
      notificationType: "item_returned",
      message: "The borrowed item has been confirmed as returned.",
      relatedBookingId: String(booking._id),
    });
    response.json({ data: booking });
  }),
);

export default router;
