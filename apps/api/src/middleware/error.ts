import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} was not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        message: "Please correct the highlighted information",
        code: "VALIDATION_ERROR",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });
    return;
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    response.status(409).json({
      error: { message: "A record with those details already exists", code: "DUPLICATE_RECORD" },
    });
    return;
  }

  if (error instanceof Error && error.name === "CastError") {
    response.status(400).json({ error: { message: "Invalid identifier", code: "INVALID_ID" } });
    return;
  }

  if (error instanceof Error && error.name === "ValidationError") {
    response.status(400).json({ error: { message: error.message, code: "DATABASE_VALIDATION" } });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: { message: "Something went wrong on the server", code: "INTERNAL_ERROR" },
  });
};
