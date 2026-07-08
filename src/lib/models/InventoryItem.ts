import mongoose, { Schema, type InferSchemaType } from "mongoose";

const InventoryItemSchema = new Schema(
  {
    itemCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    materialType: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ["donated", "purchased", "factory-offcut", "returned-garment"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["kg", "pieces", "meters"], default: "pieces" },
    dateReceived: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["raw", "processing", "converted", "discarded"],
      default: "raw",
    },
  },
  { timestamps: true }
);

export type InventoryItem = InferSchemaType<typeof InventoryItemSchema>;

export default mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema);
