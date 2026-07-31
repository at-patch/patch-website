import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ShippingZoneSchema = new Schema(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    scope: { type: String, enum: ["country", "district"], required: true },
    district: { type: String, default: "", trim: true },
    districtSlug: { type: String, default: "", lowercase: true, trim: true },
    baseRate: { type: Number, required: true, min: 0 },
    additionalKgRate: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, required: true, default: "BDT", uppercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShippingZoneSchema.index(
  { countryCode: 1, scope: 1, districtSlug: 1 },
  { unique: true, name: "unique_shipping_destination" }
);
ShippingZoneSchema.index({ countryName: 1, district: 1 });

export type ShippingZone = InferSchemaType<typeof ShippingZoneSchema>;

export default mongoose.models.ShippingZone ||
  mongoose.model("ShippingZone", ShippingZoneSchema);
