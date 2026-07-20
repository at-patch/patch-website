import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ProductBatchSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ProductBatch = InferSchemaType<typeof ProductBatchSchema>;

export default mongoose.models.ProductBatch ||
  mongoose.model("ProductBatch", ProductBatchSchema);
