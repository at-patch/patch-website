import { z } from "zod";
import { SIZES } from "@/lib/constants";

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+[1-9]\d{7,14}$/.test(value), "Enter a valid phone number with country code.");

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: phoneSchema,
  email: z.email("Enter a valid email address."),
  addressLine: z.string().trim().min(1, "Address is required."),
  city: z.string().trim().min(1, "City is required."),
  citySlug: z.string().trim().optional(),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).default("BD"),
  district: z.string().trim().optional(),
  districtSlug: z.string().trim().optional(),
  notes: z.string().optional(),
});

const orderItemSchema = z.object({
  product: z.string().min(1, "Product is required."),
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  image: z.string().optional(),
  size: z.enum(SIZES),
  color: z.string().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Cart is empty."),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.literal("card"),
  currency: z.enum(["BDT", "USD", "EUR", "GBP", "CNY"]).default("BDT"),
  couponCode: z.string().trim().optional(),
  courierClass: z.enum(["premium", "express", "economy"]).optional(),
});

export const checkoutSessionSchema = z.object({
  orderId: z.string().min(1, "Order id is required."),
});

export const shippingQuoteSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1, "Cart is empty.").max(100),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  districtSlug: z.string().trim().optional(),
  courierClass: z.enum(["premium", "express", "economy"]).optional(),
});

// Only fields the admin UI actually edits — unknown keys are stripped by
// zod's default "strip" mode, closing off mass-assignment via this route.
export const adminOrderUpdateSchema = z
  .object({
    status: z.enum(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
    trackingNumber: z.string(),
    carrier: z.string(),
  })
  .partial();
