import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    reviewText: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    productRef: { type: Schema.Types.ObjectId, ref: "Product" },
    verifiedBuyer: { type: Boolean, default: true },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Review = InferSchemaType<typeof ReviewSchema>;

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
