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
    emailVerified: { type: Boolean, default: false },
    // Only SHA-256 hashes of the one-time tokens are stored; the raw token
    // exists solely in the email link.
    resetTokenHash: { type: String, default: "" },
    resetTokenExpiresAt: { type: Date, default: null },
    verifyTokenHash: { type: String, default: "" },
    verifyTokenExpiresAt: { type: Date, default: null },
    addresses: { type: [SavedAddressSchema], default: [] },
    wishlist: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true }
);

export type Customer = InferSchemaType<typeof CustomerSchema>;

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
