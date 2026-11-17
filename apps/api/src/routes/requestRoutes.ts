import { Router } from "express";
import { requestCreateSchema } from "@lendly/shared";
import { BorrowRequest } from "../models/BorrowRequest.js";
import { Item } from "../models/Item.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  acceptBorrowRequest,
  getAvailability,
  isWithinAvailability,
} from "../services/bookingService.js";
import { createNotification } from "../services/notificationService.js";
import { participantIds } from "../utils/participants.js";

const router = Router();

const userPopulation = "name profileImage verificationStatus averageRating reviewCount";

router.post(
  "/",
  requireAuth,
  validateBody(requestCreateSchema),
  asyncHandler(async (request, response) => {
    const body = request.body as {
      itemId: string;
      requestedQuantity: number;
      startDate: Date;
      endDate: Date;
      message: string;
    };
    const item = await Item.findById(body.itemId);
    if (!item) throw new AppError(404, "Item not found");
    if (item.listingStatus !== "active") throw new AppError(409, "This listing is not active");
    if (String(item.ownerId) === request.user!.userId) {
      throw new AppError(400, "You cannot request your own item");
    }
    if (body.requestedQuantity > item.totalQuantity) {
      throw new AppError(400, "Requested quantity exceeds the listed quantity");
    }
    if (!isWithinAvailability(item, body.startDate, body.endDate)) {
      throw new AppError(409, "The selected dates are outside the listing availability");
    }

    const availability = await getAvailability(item, body.startDate, body.endDate);
    if (body.requestedQuantity > availability.availableQuantity) {
      throw new AppError(
        409,
        `Only ${availability.availableQuantity} unit(s) are available for these dates`,
        { availableQuantity: availability.availableQuantity },
        "INSUFFICIENT_INVENTORY",
      );
    }

    const duplicate = await BorrowRequest.exists({
      itemId: item._id,
      borrowerId: request.user!.userId,
      startDate: body.startDate,
      endDate: body.endDate,
      requestStatus: "pending",
    });
    if (duplicate) throw new AppError(409, "You already have a pending request for these dates");

    const borrowRequest = await BorrowRequest.create({
      itemId: item._id,
      borrowerId: request.user!.userId,
      lenderId: item.ownerId,
      requestedQuantity: body.requestedQuantity,
      startDate: body.startDate,
      endDate: body.endDate,
      message: body.message,
      requestStatus: "pending",
    });

    await createNotification({
      userId: String(item.ownerId),
      notificationType: "request_received",
      message: `New borrowing request for ${item.itemName}.`,
      relatedRequestId: String(borrowRequest._id),
    });

    await borrowRequest.populate([
      { path: "itemId", select: "itemName images category" },
      { path: "borrowerId", select: userPopulation },
      { path: "lenderId", select: userPopulation },
    ]);
    response.status(201).json({ data: borrowRequest });
  }),
);

router.get(
  "/incoming",
  requireAuth,
  asyncHandler(async (request, response) => {
    const requests = await BorrowRequest.find({ lenderId: request.user!.userId })
      .sort({ createdAt: -1 })
      .populate("itemId", "itemName images category")
      .populate("borrowerId", userPopulation)
      .populate("lenderId", userPopulation);
    response.json({ data: requests });
  }),
);

router.get(
  "/outgoing",
  requireAuth,
  asyncHandler(async (request, response) => {
    const requests = await BorrowRequest.find({ borrowerId: request.user!.userId })
      .sort({ createdAt: -1 })
      .populate("itemId", "itemName images category")
      .populate("borrowerId", userPopulation)
      .populate("lenderId", userPopulation);
    response.json({ data: requests });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const borrowRequest = await BorrowRequest.findById(request.params.id)
      .populate("itemId", "itemName images category")
      .populate("borrowerId", userPopulation)
      .populate("lenderId", userPopulation);
    if (!borrowRequest) throw new AppError(404, "Request not found");
    if (!participantIds(borrowRequest).includes(request.user!.userId)) {
      throw new AppError(403, "You do not have access to this request");
    }
    response.json({ data: borrowRequest });
  }),
);

router.patch(
  "/:id/accept",
  requireAuth,
  asyncHandler(async (request, response) => {
    const booking = await acceptBorrowRequest(String(request.params.id), request.user!.userId);
    await booking.populate([
      { path: "itemId", select: "itemName images category" },
      { path: "borrowerId", select: userPopulation },
      { path: "lenderId", select: userPopulation },
    ]);
    response.json({ data: booking });
  }),
);

router.patch(
  "/:id/reject",
  requireAuth,
  asyncHandler(async (request, response) => {
    const borrowRequest = await BorrowRequest.findById(request.params.id);
    if (!borrowRequest) throw new AppError(404, "Request not found");
    if (String(borrowRequest.lenderId) !== request.user!.userId) {
      throw new AppError(403, "Only the lender can reject this request");
    }
    if (borrowRequest.requestStatus !== "pending") {
      throw new AppError(409, "This request has already been processed");
    }

    borrowRequest.requestStatus = "rejected";
    await borrowRequest.save();
    await createNotification({
      userId: String(borrowRequest.borrowerId),
      notificationType: "request_rejected",
      message: "Your borrowing request was declined by the lender.",
      relatedRequestId: String(borrowRequest._id),
    });
    response.json({ data: borrowRequest });
  }),
);

router.patch(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (request, response) => {
    const borrowRequest = await BorrowRequest.findById(request.params.id);
    if (!borrowRequest) throw new AppError(404, "Request not found");
    if (String(borrowRequest.borrowerId) !== request.user!.userId) {
      throw new AppError(403, "Only the borrower can cancel this request");
    }
    if (borrowRequest.requestStatus !== "pending") {
      throw new AppError(409, "Only pending requests can be cancelled");
    }

    borrowRequest.requestStatus = "cancelled";
    await borrowRequest.save();
    await createNotification({
      userId: String(borrowRequest.lenderId),
      notificationType: "request_cancelled",
      message: "The borrower cancelled a pending request.",
      relatedRequestId: String(borrowRequest._id),
    });
    response.json({ data: borrowRequest });
  }),
);

export default router;
