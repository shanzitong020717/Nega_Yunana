import { z } from "zod";

export const nonEmptyString = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, message),
  );

export const stringArraySchema = z.array(z.string().trim().min(1)).default([]);

export const optionalString = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().optional(),
  )
  .transform((value) => (value === "" ? undefined : value));
