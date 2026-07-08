import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type ContactMessage = InferSchemaType<typeof ContactMessageSchema>;

export default mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);
