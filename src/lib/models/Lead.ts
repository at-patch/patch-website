import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    interest: { type: String, default: "" },
    source: { type: String, default: "chat" },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Lead = InferSchemaType<typeof LeadSchema>;

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
