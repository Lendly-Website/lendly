import { Router } from "express";
import type { PipelineStage } from "mongoose";
import { z } from "zod";
import {
  ITEM_CATEGORIES,
  itemCreateSchema,
  itemSearchSchema,
  itemUpdateSchema,
} from "@lendly/shared";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Booking } from "../models/Booking.js";
import { BorrowRequest } from "../models/BorrowRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getAvailability } from "../services/bookingService.js";

const router = Router();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function attachOwner(items: Array<Record<string, unknown>>): Promise<void> {
  const ownerIds = items.map((item) => String(item.ownerId));
  const owners = await User.find({ _id: { $in: ownerIds } }).select(
    "name profileImage verificationStatus averageRating reviewCount",
  );
  const ownerMap = new Map(owners.map((owner) => [String(owner._id), owner.toJSON()]));
  for (const item of items) {
    item.owner = ownerMap.get(String(item.ownerId));
  }
}

router.get("/categories", (_request, response) => {
  response.json({ data: ITEM_CATEGORIES });
});

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (request, response) => {
    const items = await Item.find({ ownerId: request.user!.userId }).sort({ createdAt: -1 });
    const data = items.map((item) => item.toJSON() as unknown as Record<string, unknown>);
    await attachOwner(data);
    response.json({ data });
  }),
);

router.get(
  "/",
  validateQuery(itemSearchSchema),
  asyncHandler(async (request, response) => {
    const search = request.validatedQuery as z.infer<typeof itemSearchSchema>;
    const match: Record<string, unknown> = { listingStatus: "active" };

    if (search.q) {
      const expression = new RegExp(escapeRegex(search.q), "i");
      match.$or = [{ itemName: expression }, { description: expression }];
    }
    if (search.category) match.category = search.category;
    if (search.condition) match.condition = search.condition;
    if (search.minPrice !== undefined || search.maxPrice !== undefined) {
      match.rentalPrice = {
        ...(search.minPrice !== undefined ? { $gte: search.minPrice } : {}),
        ...(search.maxPrice !== undefined ? { $lte: search.maxPrice } : {}),
      };
    }
    if (search.startDate && search.endDate) {
      match.availability = {
        $elemMatch: {
          startDate: { $lte: search.startDate },
          endDate: { $gte: search.endDate },
        },
      };
    }

    const hasCoordinates = search.latitude !== undefined && search.longitude !== undefined;
    const pipeline: PipelineStage[] = [];

    if (hasCoordinates) {
      const longitude = search.longitude ?? 0;
      const latitude = search.latitude ?? 0;
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distanceMeters",
          maxDistance: search.radius,
          spherical: true,
          query: match,
        },
      });
    } else {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $lookup: {
        from: "bookings",
        let: {
          itemId: "$_id",
          requestedStart: search.startDate ?? new Date("1970-01-01T00:00:00.000Z"),
          requestedEnd: search.endDate ?? new Date("2099-12-31T23:59:59.999Z"),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$itemId", "$$itemId"] },
                  { $lte: ["$startDate", "$$requestedEnd"] },
                  { $gte: ["$endDate", "$$requestedStart"] },
                  {
                    $in: [
                      "$bookingStatus",
                      ["confirmed", "active", "returned", "completed", "disputed"],
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "conflictingBookings",
      },
    });

    pipeline.push({
      $set: {
        bookedQuantity: { $sum: "$conflictingBookings.quantity" },
      },
    });
    pipeline.push({
      $match: {
        $expr: {
          $gte: [{ $subtract: ["$totalQuantity", "$bookedQuantity"] }, 1],
        },
      },
    });

    const sortStage: Record<string, 1 | -1> =
      search.sort === "price_low"
        ? { rentalPrice: 1 }
        : search.sort === "price_high"
          ? { rentalPrice: -1 }
          : search.sort === "newest"
            ? { createdAt: -1 }
            : search.sort === "distance" && hasCoordinates
              ? { distanceMeters: 1 }
              : { createdAt: -1 };
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        results: [
          { $skip: (search.page - 1) * search.limit },
          { $limit: search.limit },
          { $project: { conflictingBookings: 0, bookedQuantity: 0 } },
        ],
      },
    });

    const [result] = await Item.aggregate(pipeline);
    const data = ((result?.results ?? []) as Array<unknown>).map((item) => {
      const normalized = item as unknown as Record<string, unknown>;
      normalized.id = String(normalized._id);
      delete normalized._id;
      delete normalized.__v;
      return normalized;
    });
    await attachOwner(data);
    const total = result?.metadata?.[0]?.total ?? 0;

    response.json({
      data,
      pagination: {
        page: search.page,
        limit: search.limit,
        total,
        pages: Math.ceil(total / search.limit),
      },
    });
  }),
);

const availabilityQuerySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((value) => value.endDate >= value.startDate);

router.get(
  "/:id/reviews",
  asyncHandler(async (request, response) => {
    const item = await Item.findById(request.params.id);
    if (!item) throw new AppError(404, "Item not found");
    const bookings = await Booking.find({ itemId: item._id }).select("_id");
    const reviews = await Review.find({
      bookingId: { $in: bookings.map((booking) => booking._id) },
    })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "name profileImage");
    response.json({ data: reviews });
  }),
);

router.get(
  "/:id/availability",
  validateQuery(availabilityQuerySchema),
  asyncHandler(async (request, response) => {
    const item = await Item.findById(request.params.id);
    if (!item) throw new AppError(404, "Item not found");
    const query = request.validatedQuery as z.infer<typeof availabilityQuerySchema>;
    const availability = await getAvailability(item, query.startDate, query.endDate);
    response.json({ data: { ...availability, totalQuantity: item.totalQuantity } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const item = await Item.findById(request.params.id);
    if (!item) throw new AppError(404, "Item not found");
    const data = item.toJSON() as unknown as Record<string, unknown>;
    await attachOwner([data]);
    response.json({ data });
  }),
);

router.post(
  "/",
  requireAuth,
  validateBody(itemCreateSchema),
  asyncHandler(async (request, response) => {
    const body = request.body as z.infer<typeof itemCreateSchema>;
    const item = await Item.create({
      ...body,
      ownerId: request.user!.userId,
      availableQuantity: body.totalQuantity,
      coordinates: {
        type: "Point",
        coordinates: [body.location.longitude, body.location.latitude],
      },
    });
    const data = item.toJSON() as unknown as Record<string, unknown>;
    await attachOwner([data]);
    response.status(201).json({ data });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  validateBody(itemUpdateSchema),
  asyncHandler(async (request, response) => {
    const item = await Item.findById(request.params.id);
    if (!item) throw new AppError(404, "Item not found");
    if (String(item.ownerId) !== request.user!.userId) {
      throw new AppError(403, "Only the owner can edit this listing");
    }

    const body = request.body as z.infer<typeof itemUpdateSchema>;
    if (body.location) {
      item.coordinates = {
        type: "Point",
        coordinates: [body.location.longitude, body.location.latitude],
      };
    }
    if (body.totalQuantity !== undefined) {
      if (body.totalQuantity < item.totalQuantity) {
        const activeBookings = await Booking.countDocuments({
          itemId: item._id,
          bookingStatus: { $nin: ["cancelled", "completed", "returned"] },
          quantity: { $gt: body.totalQuantity },
        });
        if (activeBookings > 0) {
          throw new AppError(409, "Quantity is lower than an existing booking requires");
        }
      }
      item.totalQuantity = body.totalQuantity;
      item.availableQuantity = body.totalQuantity;
    }

    Object.assign(item, body);
    await item.save();
    const data = item.toJSON() as unknown as Record<string, unknown>;
    await attachOwner([data]);
    response.json({ data });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const item = await Item.findById(request.params.id);
    if (!item) throw new AppError(404, "Item not found");
    if (String(item.ownerId) !== request.user!.userId && request.user!.role !== "admin") {
      throw new AppError(403, "Only the owner can remove this listing");
    }

    const activeBooking = await Booking.exists({
      itemId: item._id,
      bookingStatus: { $in: ["confirmed", "active", "returned"] },
    });
    if (activeBooking) throw new AppError(409, "This listing has an active booking");

    const pendingRequest = await BorrowRequest.exists({
      itemId: item._id,
      requestStatus: "pending",
    });
    if (pendingRequest) {
      await BorrowRequest.updateMany(
        { itemId: item._id, requestStatus: "pending" },
        { $set: { requestStatus: "cancelled" } },
      );
    }

    item.listingStatus = "removed";
    await item.save();
    response.status(204).send();
  }),
);

export default router;
