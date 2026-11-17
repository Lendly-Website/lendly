import { model, Schema } from "mongoose";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  LISTING_STATUSES,
  type ItemCategory,
  type ItemCondition,
  type ListingStatus,
} from "@lendly/shared";

export interface ItemDocument {
  ownerId: Schema.Types.ObjectId;
  itemName: string;
  category: ItemCategory;
  description: string;
  images: string[];
  condition: ItemCondition;
  totalQuantity: number;
  availableQuantity: number;
  location: {
    address: string;
    locality: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  rentalPrice: number;
  borrowingTerms: string;
  availability: Array<{ startDate: Date; endDate: Date }>;
  listingStatus: ListingStatus;
}

const locationSchema = new Schema(
  {
    address: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, default: "Pune" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const availabilitySchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false },
);

const itemSchema = new Schema<ItemDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemName: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: ITEM_CATEGORIES, required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    images: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, "At least one image is required"] },
    condition: { type: String, enum: ITEM_CONDITIONS, required: true, index: true },
    totalQuantity: { type: Number, required: true, min: 1, max: 100 },
    availableQuantity: { type: Number, required: true, min: 0, max: 100 },
    location: { type: locationSchema, required: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) => value.length === 2,
          message: "Coordinates must contain longitude and latitude",
        },
      },
    },
    rentalPrice: { type: Number, required: true, min: 0, default: 0 },
    borrowingTerms: { type: String, required: true, trim: true, maxlength: 2000 },
    availability: { type: [availabilitySchema], required: true },
    listingStatus: { type: String, enum: LISTING_STATUSES, default: "active", index: true },
  },
  { timestamps: true },
);

itemSchema.index({ coordinates: "2dsphere" });
itemSchema.index({ itemName: "text", description: "text", category: "text" });

itemSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Item = model<any>("Item", itemSchema);
