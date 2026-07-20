import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    // 0 means unlimited uses.
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Coupon = InferSchemaType<typeof CouponSchema>;

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
