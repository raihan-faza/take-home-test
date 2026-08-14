import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors/http.error.ts";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Invalid input";
    return res.status(400).json({ message });
  }
  if (err instanceof Error && err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
