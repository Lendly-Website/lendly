import { Notification, type NotificationDocument } from "../models/Notification.js";
import type { NotificationType } from "@lendly/shared";

interface NotificationInput {
  userId: string;
  notificationType: NotificationType;
  message: string;
  relatedBookingId?: string;
  relatedRequestId?: string;
}

export async function createNotification(input: NotificationInput): Promise<NotificationDocument> {
  return Notification.create({
    userId: input.userId,
    notificationType: input.notificationType,
    message: input.message,
    relatedBookingId: input.relatedBookingId,
    relatedRequestId: input.relatedRequestId,
  });
}

export async function createNotifications(inputs: NotificationInput[]): Promise<void> {
  if (inputs.length === 0) return;
  await Notification.insertMany(inputs);
}
