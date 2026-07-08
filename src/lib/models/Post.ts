import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    category: {
      type: String,
      enum: ["sustainability", "styling-tips", "behind-the-scenes"],
      required: true,
    },
    author: { type: String, default: "The Patch Team" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Post = InferSchemaType<typeof PostSchema>;

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
