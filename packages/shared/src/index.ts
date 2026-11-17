import { z } from "zod";

export const USER_ROLES = ["user", "admin"] as const;
export const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;
export const ITEM_CONDITIONS = ["new", "like-new", "good", "fair"] as const;
export const LISTING_STATUSES = ["active", "paused", "removed"] as const;
export const REQUEST_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "expired",
] as const;
export const BOOKING_STATUSES = [
  "confirmed",
  "active",
  "returned",
  "completed",
  "cancelled",
  "disputed",
] as const;
export const HANDOVER_STATUSES = ["pending", "confirmed"] as const;
export const RETURN_STATUSES = ["pending", "confirmed"] as const;
export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export const REPORT_TARGET_TYPES = ["user", "item", "review"] as const;
export const NOTIFICATION_TYPES = [
  "request_received",
  "request_accepted",
  "request_rejected",
  "request_cancelled",
  "booking_confirmed",
  "return_due",
  "item_returned",
  "review_added",
  "verification_updated",
  "report_updated",
] as const;

export const ITEM_CATEGORIES = [
  "Books & Stationery",
  "Electronics",
  "Projectors & Event Gear",
  "Sports & Fitness",
  "Tools & Equipment",
  "Home & Cleaning",
  "Travel & Camping",
  "Fashion & Accessories",
  "Furniture & Decor",
  "Other",
] as const;

export const CONDITION_LABELS: Record<(typeof ITEM_CONDITIONS)[number], string> = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
};

export const REQUEST_STATUS_LABELS: Record<(typeof REQUEST_STATUSES)[number], string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const BOOKING_STATUS_LABELS: Record<(typeof BOOKING_STATUSES)[number], string> = {
  confirmed: "Confirmed",
  active: "Active",
  returned: "Returned",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

export const locationSchema = z.object({
  address: z.string().trim().min(3).max(300),
  locality: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100).default("Pune"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  phone: z.string().trim().max(20).optional(),
  location: locationSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: registerSchema.shape.password,
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(20).nullable().optional(),
    profileImage: z.string().url().nullable().optional(),
    location: locationSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registerSchema.shape.password,
});

export const availabilityWindowSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((window) => window.endDate >= window.startDate, {
    message: "Availability end date must be on or after the start date",
    path: ["endDate"],
  });

export const imageSchema = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/uploads/") || URL.canParse(value), {
    message: "Upload a valid image",
  });

export const itemCreateSchema = z.object({
  itemName: z.string().trim().min(3).max(120),
  category: z.enum(ITEM_CATEGORIES),
  description: z.string().trim().min(20).max(3000),
  images: z.array(imageSchema).min(1, "Add at least one image").max(8),
  condition: z.enum(ITEM_CONDITIONS),
  totalQuantity: z.number().int().min(1).max(100),
  location: locationSchema,
  rentalPrice: z.number().min(0).max(100000),
  borrowingTerms: z.string().trim().min(10).max(2000),
  availability: z.array(availabilityWindowSchema).min(1).max(20),
  listingStatus: z.enum(LISTING_STATUSES).default("active"),
});

export const itemUpdateSchema = itemCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update",
);

export const itemSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(100).max(100000).default(1000),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  sort: z.enum(["relevance", "distance", "price_low", "price_high", "newest"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const requestCreateSchema = z
  .object({
    itemId: z.string().min(1),
    requestedQuantity: z.number().int().min(1).max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    message: z.string().trim().max(1000).optional().default(""),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const reviewCreateSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  reliabilityRating: z.number().int().min(1).max(5),
  itemHandlingRating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1),
  reason: z.enum([
    "inappropriate",
    "misleading",
    "unsafe",
    "fraud",
    "harassment",
    "damaged_item",
    "late_return",
    "other",
  ]),
  details: z.string().trim().min(10).max(2000),
});

export const adminUserUpdateSchema = z.object({
  isSuspended: z.boolean().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  role: z.enum(USER_ROLES).optional(),
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  resolution: z.string().trim().max(2000).optional(),
});

export const bookingActionSchema = z.object({
  initialCondition: z.string().trim().min(3).max(1000).optional(),
  finalCondition: z.string().trim().min(3).max(1000).optional(),
});

export type UserRole = (typeof USER_ROLES)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export type Location = z.infer<typeof locationSchema>;

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  location?: Location;
  verificationStatus: VerificationStatus;
  averageRating: number;
  reviewCount: number;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  owner?: Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount">;
  itemName: string;
  category: ItemCategory;
  description: string;
  images: string[];
  condition: ItemCondition;
  totalQuantity: number;
  availableQuantity: number;
  location: Location;
  rentalPrice: number;
  borrowingTerms: string;
  availability: Array<{ startDate: string; endDate: string }>;
  listingStatus: ListingStatus;
  distanceMeters?: number;
  createdAt: string;
}

export interface BorrowRequest {
  id: string;
  itemId: string;
  item?: Pick<Item, "id" | "itemName" | "images" | "category">;
  borrowerId: string;
  lenderId: string;
  borrower?: Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount">;
  lender?: Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount">;
  requestedQuantity: number;
  startDate: string;
  endDate: string;
  message: string;
  requestStatus: RequestStatus;
  bookingId?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  requestId: string;
  itemId: string;
  item?: Pick<Item, "id" | "itemName" | "images" | "category">;
  borrowerId: string;
  lenderId: string;
  borrower?: Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount">;
  lender?: Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount">;
  quantity: number;
  startDate: string;
  endDate: string;
  rentalAmount: number;
  bookingStatus: BookingStatus;
  handoverStatus: HandoverStatus;
  returnStatus: ReturnStatus;
  initialCondition?: string;
  finalCondition?: string;
  handoverAt?: string;
  returnedAt?: string;
  createdAt: string;
}

export type HandoverStatus = (typeof HANDOVER_STATUSES)[number];
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  reviewer?: Pick<UserPublic, "id" | "name" | "profileImage">;
  reviewedUser?: Pick<UserPublic, "id" | "name" | "profileImage">;
  rating: number;
  communicationRating: number;
  reliabilityRating: number;
  itemHandlingRating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  notificationType: NotificationType;
  message: string;
  relatedBookingId?: string;
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter?: Pick<UserPublic, "id" | "name" | "email">;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  resolution?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  "Books & Stationery": "BookOpen",
  Electronics: "Laptop",
  "Projectors & Event Gear": "Projector",
  "Sports & Fitness": "Dumbbell",
  "Tools & Equipment": "Wrench",
  "Home & Cleaning": "Sparkles",
  "Travel & Camping": "TentTree",
  "Fashion & Accessories": "Shirt",
  "Furniture & Decor": "Armchair",
  Other: "Package",
};
