import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@lendly/shared";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

function authPayload(user: InstanceType<typeof User>) {
  return {
    token: signToken({ userId: String(user._id), role: user.role }),
    user: user.toJSON(),
  };
}

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    const { email, password, ...profile } = request.body as {
      email: string;
      password: string;
      name: string;
      phone?: string;
      location?: {
        address: string;
        locality: string;
        city: string;
        latitude: number;
        longitude: number;
      };
    };

    const existing = await User.exists({ email });
    if (existing) throw new AppError(409, "An account already exists with this email");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...profile, email, passwordHash });
    response.status(201).json({ data: authPayload(user) });
  }),
);

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "Email or password is incorrect");
    }
    if (user.isSuspended) throw new AppError(403, "This account has been suspended");

    response.json({ data: authPayload(user) });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await User.findById(request.user!.userId);
    if (!user) throw new AppError(404, "Account not found");
    response.json({ data: user });
  }),
);

router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (request, response) => {
    const { email } = request.body as { email: string };
    const user = await User.findOne({ email });
    let resetToken: string | undefined;

    if (user) {
      resetToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordToken = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
    }

    response.json({
      data: {
        message: "If an account exists for that email, a reset token has been generated.",
        ...(env.nodeEnv !== "production" && env.exposeResetToken && resetToken
          ? { resetToken }
          : {}),
      },
    });
  }),
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(async (request, response) => {
    const { token, password } = request.body as { token: string; password: string };
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) throw new AppError(400, "This reset token is invalid or has expired");

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    response.json({ data: { message: "Password reset successfully" } });
  }),
);

router.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (request, response) => {
    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };
    const user = await User.findById(request.user!.userId).select("+passwordHash");
    if (!user) throw new AppError(404, "Account not found");
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError(400, "Current password is incorrect");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    response.json({ data: { message: "Password updated successfully" } });
  }),
);

router.post("/logout", requireAuth, (_request, response) => {
  response.status(204).send();
});

export default router;
