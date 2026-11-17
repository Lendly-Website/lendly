import { model, Schema } from "mongoose";
import { splitReferences } from "./serializeRefs.js";
import { REQUEST_STATUSES, type RequestStatus } from "@lendly/shared";

export interface BorrowRequestDocument {
  itemId: Schema.Types.ObjectId;
  borrowerId: Schema.Types.ObjectId;
  lenderId: Schema.Types.ObjectId;
  requestedQuantity: number;
  startDate: Date;
  endDate: Date;
  message: string;
  requestStatus: RequestStatus;
  bookingId?: Schema.Types.ObjectId;
}

const requestSchema = new Schema<BorrowRequestDocument>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    borrowerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedQuantity: { type: Number, required: true, min: 1, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    message: { type: String, trim: true, maxlength: 1000, default: "" },
    requestStatus: { type: String, enum: REQUEST_STATUSES, default: "pending", required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true },
);

requestSchema.index({ lenderId: 1, requestStatus: 1, createdAt: -1 });
requestSchema.index({ borrowerId: 1, requestStatus: 1, createdAt: -1 });

requestSchema.set("toJSON", {
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

export const BorrowRequest = model<any>("BorrowRequest", requestSchema);
