import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ShippingCitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    division: { type: String, default: "", trim: true },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ShippingCity = InferSchemaType<typeof ShippingCitySchema>;

export default mongoose.models.ShippingCity ||
  mongoose.model("ShippingCity", ShippingCitySchema);
