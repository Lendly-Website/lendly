import { Router } from "express";
import { z } from "zod";
import {
  adminReportUpdateSchema,
  adminUserUpdateSchema,
  LISTING_STATUSES,
  REPORT_STATUSES,
  VERIFICATION_STATUSES,
} from "@lendly/shared";
import { User } from "../models/User.js";
import { Item } from "../models/Item.js";
import { Booking } from "../models/Booking.js";
import { BorrowRequest } from "../models/BorrowRequest.js";
import { Review } from "../models/Review.js";
import { Report } from "../models/Report.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../services/notificationService.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get(
  "/stats",
  asyncHandler(async (_request, response) => {
    const [users, listings, activeListings, requests, bookings, completedReturns, openReports, reviews] =
      await Promise.all([
        User.countDocuments(),
        Item.countDocuments(),
        Item.countDocuments({ listingStatus: "active" }),
        BorrowRequest.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ returnStatus: "confirmed" }),
        Report.countDocuments({ status: "open" }),
        Review.countDocuments(),
      ]);

    response.json({
      data: {
        users,
        listings,
        activeListings,
        requests,
        bookings,
        completedReturns,
        openReports,
        reviews,
      },
    });
  }),
);

const userQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/users",
  validateQuery(userQuerySchema),
  asyncHandler(async (request, response) => {
    const query = request.validatedQuery as z.infer<typeof userQuerySchema>;
    const match = query.q
      ? {
          $or: [
            { name: new RegExp(query.q, "i") },
            { email: new RegExp(query.q, "i") },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(match)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      User.countDocuments(match),
    ]);

    response.json({
      data: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }),
);

router.patch(
  "/users/:id",
  validateBody(adminUserUpdateSchema),
  asyncHandler(async (request, response) => {
    const updates = request.body as {
      isSuspended?: boolean;
      verificationStatus?: (typeof VERIFICATION_STATUSES)[number];
      role?: "user" | "admin";
    };

    const user = await User.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new AppError(404, "User not found");

    if (updates.verificationStatus) {
      await createNotification({
        userId: String(user._id),
        notificationType: "verification_updated",
        message: `Your verification status is now ${user.verificationStatus}.`,
      });
    }

    response.json({ data: user });
  }),
);

const listingQuerySchema = z.object({
  status: z.enum(LISTING_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/listings",
  validateQuery(listingQuerySchema),
  asyncHandler(async (request, response) => {
    const query = request.validatedQuery as z.infer<typeof listingQuerySchema>;
    const match: Record<string, unknown> = {};
    if (query.status) match.listingStatus = query.status;
    if (query.q) match.itemName = new RegExp(query.q, "i");

    const [items, total] = await Promise.all([
      Item.find(match)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate("ownerId", "name email profileImage"),
      Item.countDocuments(match),
    ]);

    response.json({
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }),
);

router.patch(
  "/listings/:id/moderate",
  validateBody(z.object({ listingStatus: z.enum(LISTING_STATUSES) })),
  asyncHandler(async (request, response) => {
    const item = await Item.findByIdAndUpdate(
      request.params.id,
      { listingStatus: request.body.listingStatus },
      { new: true, runValidators: true },
    );
    if (!item) throw new AppError(404, "Listing not found");
    response.json({ data: item });
  }),
);

const reportQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/reports",
  validateQuery(reportQuerySchema),
  asyncHandler(async (request, response) => {
    const query = request.validatedQuery as z.infer<typeof reportQuerySchema>;
    const match: Record<string, unknown> = {};
    if (query.status) match.status = query.status;

    const [reports, total] = await Promise.all([
      Report.find(match)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate("reporterId", "name email profileImage"),
      Report.countDocuments(match),
    ]);

    response.json({
      data: reports,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }),
);

router.patch(
  "/reports/:id",
  validateBody(adminReportUpdateSchema),
  asyncHandler(async (request, response) => {
    const report = await Report.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });
    if (!report) throw new AppError(404, "Report not found");

    await createNotification({
      userId: String(report.reporterId),
      notificationType: "report_updated",
      message: `Your report status changed to ${report.status}.`,
    });
    response.json({ data: report });
  }),
);

router.get(
  "/reviews",
  asyncHandler(async (_request, response) => {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(100).populate([
      { path: "reviewerId", select: "name profileImage" },
      { path: "reviewedUserId", select: "name profileImage" },
    ]);
    response.json({ data: reviews });
  }),
);

export default router;
