import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SavedAddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    area: {
      type: String,
      enum: ["gulshan", "banani", "baridhara", "other"],
      default: "other",
    },
    city: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    addresses: { type: [SavedAddressSchema], default: [] },
  },
  { timestamps: true }
);

export type Customer = InferSchemaType<typeof CustomerSchema>;

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
