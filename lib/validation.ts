import { z } from "zod";
import { STATUS_VALUES } from "./status";

export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(80);
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30)
  .regex(/^[a-z0-9_.]+$/, "Username can only use letters, numbers, _ and .");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100);
export const amountSchema = z.string().trim().regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a valid amount, for example 150 or 150.50");
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const statusSchema = z.enum(STATUS_VALUES);