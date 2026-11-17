import { Router } from "express";
import { reviewCreateSchema } from "@lendly/shared";
import { Review } from "../models/Review.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../services/notificationService.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  validateBody(reviewCreateSchema),
  asyncHandler(async (request, response) => {
    const body = request.body as {
      bookingId: string;
      rating: number;
      communicationRating: number;
      reliabilityRating: number;
      itemHandlingRating: number;
      comment: string;
    };

    const booking = await Booking.findById(body.bookingId);
    if (!booking) throw new AppError(404, "Booking not found");

    const borrowerId = String(booking.borrowerId);
    const lenderId = String(booking.lenderId);
    const reviewerId = request.user!.userId;
    if (![borrowerId, lenderId].includes(reviewerId)) {
      throw new AppError(403, "Only booking participants can submit a review");
    }
    if (!["returned", "completed"].includes(booking.bookingStatus)) {
      throw new AppError(409, "Reviews can only be submitted after item return");
    }

    const reviewedUserId = reviewerId === borrowerId ? lenderId : borrowerId;
    const existing = await Review.exists({ bookingId: booking._id, reviewerId });
    if (existing) throw new AppError(409, "You have already reviewed this transaction");

    const review = await Review.create({
      ...body,
      reviewerId,
      reviewedUserId,
    });

    const userRatings = await Review.find({ reviewedUserId }).select("rating");
    const count = userRatings.length;
    const average = count ? userRatings.reduce((sum, item) => sum + item.rating, 0) / count : 0;
    await User.findByIdAndUpdate(reviewedUserId, { averageRating: average, reviewCount: count });

    await createNotification({
      userId: reviewedUserId,
      notificationType: "review_added",
      message: `You received a new ${body.rating}-star review.`,
      relatedBookingId: String(booking._id),
    });

    await review.populate("reviewerId", "name profileImage");
    await review.populate("reviewedUserId", "name profileImage");
    response.status(201).json({ data: review });
  }),
);

router.get(
  "/booking/:bookingId",
  requireAuth,
  asyncHandler(async (request, response) => {
    const booking = await Booking.findById(request.params.bookingId);
    if (!booking) throw new AppError(404, "Booking not found");
    const reviewerId = request.user!.userId;
    if (![String(booking.borrowerId), String(booking.lenderId)].includes(reviewerId)) {
      throw new AppError(403, "You do not have access to this booking");
    }
    const review = await Review.findOne({ bookingId: booking._id, reviewerId });
    response.json({ data: review });
  }),
);

export default router;
