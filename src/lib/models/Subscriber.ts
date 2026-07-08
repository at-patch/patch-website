import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export type Subscriber = InferSchemaType<typeof SubscriberSchema>;

export default mongoose.models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);
