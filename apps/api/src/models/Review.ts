import { model, Schema } from "mongoose";

export interface ReviewDocument {
  bookingId: Schema.Types.ObjectId;
  reviewerId: Schema.Types.ObjectId;
  reviewedUserId: Schema.Types.ObjectId;
  rating: number;
  communicationRating: number;
  reliabilityRating: number;
  itemHandlingRating: number;
  comment: string;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reviewedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    reliabilityRating: { type: Number, required: true, min: 1, max: 5 },
    itemHandlingRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

reviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ reviewedUserId: 1, createdAt: -1 });

reviewSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Review = model<any>("Review", reviewSchema);
