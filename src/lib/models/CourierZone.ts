import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CourierZoneCountrySchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CourierRateTierSchema = new Schema(
  {
    courierClass: { type: String, enum: ["premium", "express", "economy"], required: true },
    minWeightKg: { type: Number, required: true, min: 0 },
    maxWeightKg: { type: Number, required: true, min: 0 },
    pricingType: { type: String, enum: ["flat", "per_kg"], required: true },
    rate: { type: Number, required: true, min: 0 },
    isDocument: { type: Boolean, default: false },
  },
  { _id: false }
);

const CourierZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    countries: { type: [CourierZoneCountrySchema], required: true },
    currency: { type: String, required: true, default: "BDT", uppercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    rates: { type: [CourierRateTierSchema], required: true },
  },
  { timestamps: true }
);

CourierZoneSchema.index({ "countries.code": 1 });

export type CourierZone = InferSchemaType<typeof CourierZoneSchema>;
export type CourierRateTierDoc = InferSchemaType<typeof CourierRateTierSchema>;

export default mongoose.models.CourierZone || mongoose.model("CourierZone", CourierZoneSchema);
