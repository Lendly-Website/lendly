import { model, Schema } from "mongoose";
import { splitReferences } from "./serializeRefs.js";
import {
  BOOKING_STATUSES,
  HANDOVER_STATUSES,
  RETURN_STATUSES,
  type BookingStatus,
  type HandoverStatus,
  type ReturnStatus,
} from "@lendly/shared";

export interface BookingDocument {
  requestId: Schema.Types.ObjectId;
  itemId: Schema.Types.ObjectId;
  borrowerId: Schema.Types.ObjectId;
  lenderId: Schema.Types.ObjectId;
  quantity: number;
  startDate: Date;
  endDate: Date;
  rentalAmount: number;
  bookingStatus: BookingStatus;
  handoverStatus: HandoverStatus;
  returnStatus: ReturnStatus;
  initialCondition?: string;
  finalCondition?: string;
  handoverAt?: Date;
  returnedAt?: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "BorrowRequest", required: true, unique: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    borrowerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentalAmount: { type: Number, required: true, min: 0 },
    bookingStatus: { type: String, enum: BOOKING_STATUSES, default: "confirmed", required: true, index: true },
    handoverStatus: { type: String, enum: HANDOVER_STATUSES, default: "pending", required: true },
    returnStatus: { type: String, enum: RETURN_STATUSES, default: "pending", required: true },
    initialCondition: { type: String, trim: true, maxlength: 1000 },
    finalCondition: { type: String, trim: true, maxlength: 1000 },
    handoverAt: { type: Date },
    returnedAt: { type: Date },
  },
  { timestamps: true },
);

bookingSchema.index({ itemId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ borrowerId: 1, lenderId: 1, createdAt: -1 });

bookingSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    splitReferences(result, {
      itemId: "item",
      borrowerId: "borrower",
      lenderId: "lender",
    });
    return result;
  },
});

export const Booking = model<any>("Booking", bookingSchema);
