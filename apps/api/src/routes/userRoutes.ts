import { Router } from "express";
import { updateProfileSchema } from "@lendly/shared";
import { User } from "../models/User.js";
import { Item } from "../models/Item.js";
import { Review } from "../models/Review.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const user = await User.findById(request.params.id);
    if (!user) throw new AppError(404, "User not found");

    const publicUser = user.toJSON() as unknown as Record<string, unknown>;
    delete publicUser.email;
    delete publicUser.phone;

    response.json({ data: publicUser });
  }),
);

router.get(
  "/:id/items",
  asyncHandler(async (request, response) => {
    const items = await Item.find({ ownerId: request.params.id, listingStatus: "active" })
      .sort({ createdAt: -1 })
      .populate("ownerId", "name profileImage verificationStatus averageRating reviewCount");
    response.json({ data: items });
  }),
);

router.get(
  "/:id/reviews",
  asyncHandler(async (request, response) => {
    const reviews = await Review.find({ reviewedUserId: request.params.id })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "name profileImage")
      .populate("reviewedUserId", "name profileImage");
    response.json({ data: reviews });
  }),
);

router.patch(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  asyncHandler(async (request, response) => {
    const updates = request.body as {
      name?: string;
      phone?: string | null;
      profileImage?: string | null;
      location?: {
        address: string;
        locality: string;
        city: string;
        latitude: number;
        longitude: number;
      };
    };
    const user = await User.findByIdAndUpdate(
      request.user!.userId,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!user) throw new AppError(404, "Account not found");
    response.json({ data: user });
  }),
);

export default router;
