import { z } from "zod";

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a discount code."),
  subtotal: z.number().min(0),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(1, "Code is required."),
  type: z.enum(["percent", "flat"]),
  value: z.number().min(0),
  minSubtotal: z.number().min(0).default(0),
  expiresAt: z.iso.datetime().nullable().optional(),
  usageLimit: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();
