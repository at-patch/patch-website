import mongoose, { Schema, type InferSchemaType } from "mongoose";

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String },
    size: { type: String, required: true },
    color: { type: String, default: "" },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    addressLine: { type: String, required: true, trim: true },
    area: {
      type: String,
      enum: ["gulshan", "banani", "baridhara", "other"],
      default: "other",
    },
    city: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    items: { type: [OrderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["bkash", "nagad", "card", "cod"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Recorded when the Stripe webhook (or success-page backstop) confirms payment,
    // so refunds can target the exact payment later.
    stripePaymentIntentId: { type: String, default: "" },
    couponCode: { type: String, default: "", uppercase: true, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    trackingNumber: { type: String, default: "", trim: true },
    carrier: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

export type Order = InferSchemaType<typeof OrderSchema>;

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
