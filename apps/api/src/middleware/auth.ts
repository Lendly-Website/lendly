import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import type { UserRole } from "@lendly/shared";

export const requireAuth = asyncHandler(
  async (request: Request, _response: Response, next: NextFunction) => {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const token = authorization.slice(7).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, "Your session is invalid or has expired");
    }

    const user = await User.findById(payload.userId);
    if (!user) throw new AppError(401, "Account no longer exists");
    if (user.isSuspended) throw new AppError(403, "This account has been suspended");

    request.user = { userId: String(user._id), role: user.role };
    next();
  },
);

export function requireRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}
