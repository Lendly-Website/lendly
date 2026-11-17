import { model, Schema } from "mongoose";
import {
  USER_ROLES,
  VERIFICATION_STATUSES,
  type UserRole,
  type VerificationStatus,
} from "@lendly/shared";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  profileImage?: string;
  location?: {
    address: string;
    locality: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  verificationStatus: VerificationStatus;
  averageRating: number;
  reviewCount: number;
  role: UserRole;
  isSuspended: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    profileImage: { type: String, trim: true },
    location: { type: locationSchema },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: "unverified",
      required: true,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: USER_ROLES, default: "user", required: true },
    isSuspended: { type: Boolean, default: false, required: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

userSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    delete result.passwordHash;
    delete result.resetPasswordToken;
    delete result.resetPasswordExpires;
    return result;
  },
});

export const User = model<any>("User", userSchema);
