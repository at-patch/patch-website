import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof CategorySchema>;

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
