import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    story: { type: String, default: "" },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    materials: { type: [String], default: [] },
    size: { type: String, default: "One Size" },
    isOneOfOne: { type: Boolean, default: true },
    batchLabel: { type: String, default: "1-of-1" },
    quantityAvailable: { type: Number, default: 1, min: 0 },
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "archived"],
      default: "available",
    },
    sourceInventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
  },
  { timestamps: true }
);

export type Product = InferSchemaType<typeof ProductSchema>;

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
