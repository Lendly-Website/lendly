import { Router } from "express";
import { reportCreateSchema } from "@lendly/shared";
import { Report } from "../models/Report.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  validateBody(reportCreateSchema),
  asyncHandler(async (request, response) => {
    const body = request.body as {
      targetType: "user" | "item" | "review";
      targetId: string;
      reason: string;
      details: string;
    };
    const report = await Report.create({
      ...body,
      reporterId: request.user!.userId,
      status: "open",
    });
    response.status(201).json({ data: report });
  }),
);

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (request, response) => {
    const reports = await Report.find({ reporterId: request.user!.userId }).sort({ createdAt: -1 });
    response.json({ data: reports });
  }),
);

export default router;
