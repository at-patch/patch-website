import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AboutNarrativeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const AboutSettingsSchema = new Schema(
  {
    key: { type: String, default: "about", unique: true, immutable: true },
    eyebrow: { type: String, default: "Our Story", trim: true },
    heroTitle: { type: String, default: "Waste nothing, wear everything.", trim: true },
    narratives: { type: [AboutNarrativeSchema], default: [] },
  },
  { timestamps: true }
);

export type AboutSettings = InferSchemaType<typeof AboutSettingsSchema>;

export default mongoose.models.AboutSettings ||
  mongoose.model("AboutSettings", AboutSettingsSchema);
