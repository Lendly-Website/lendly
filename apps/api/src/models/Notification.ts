import { model, Schema } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "@lendly/shared";

export interface NotificationDocument {
  userId: Schema.Types.ObjectId;
  notificationType: NotificationType;
  message: string;
  relatedBookingId?: Schema.Types.ObjectId;
  relatedRequestId?: Schema.Types.ObjectId;
  isRead: boolean;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    notificationType: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, maxlength: 500 },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    relatedRequestId: { type: Schema.Types.ObjectId, ref: "BorrowRequest" },
    isRead: { type: Boolean, default: false, required: true, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Notification = model<any>("Notification", notificationSchema);
