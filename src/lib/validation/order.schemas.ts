import { z } from "zod";
import { SIZES } from "@/lib/constants";

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  email: z.email("Enter a valid email address."),
  addressLine: z.string().trim().min(1, "Address is required."),
  area: z.enum(["gulshan", "banani", "baridhara", "other"]).default("other"),
  city: z.string().trim().min(1, "City is required."),
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
  paymentMethod: z.enum(["bkash", "nagad", "card", "cod"]),
  couponCode: z.string().trim().optional(),
});

export const checkoutSessionSchema = z.object({
  orderId: z.string().min(1, "Order id is required."),
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
