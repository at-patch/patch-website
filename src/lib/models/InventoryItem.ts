import mongoose, { Schema, type InferSchemaType } from "mongoose";

const InventoryItemSchema = new Schema(
  {
    itemCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    image: { type: String, required: true, trim: true },
    fabricCode: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    heightInches: { type: Number, required: true, min: 0 },
    widthInches: { type: Number, required: true, min: 0 },
    quantityPcs: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export type InventoryItem = InferSchemaType<typeof InventoryItemSchema>;

export default mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema);
