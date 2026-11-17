import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const notifications = await Notification.find({ userId: request.user!.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = await Notification.countDocuments({
      userId: request.user!.userId,
      isRead: false,
    });
    response.json({ data: notifications, unreadCount });
  }),
);

router.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(async (request, response) => {
    const notification = await Notification.findOne({
      _id: request.params.id,
      userId: request.user!.userId,
    });
    if (!notification) throw new AppError(404, "Notification not found");
    notification.isRead = true;
    await notification.save();
    response.json({ data: notification });
  }),
);

router.patch(
  "/read-all",
  requireAuth,
  asyncHandler(async (request, response) => {
    await Notification.updateMany({ userId: request.user!.userId }, { isRead: true });
    response.json({ data: { success: true } });
  }),
);

export default router;
