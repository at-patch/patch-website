import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PatternSchema = new Schema(
  {
    patternCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    patternImage: { type: String, required: true, trim: true },
    fabricCode: { type: String, required: true, trim: true },
    sampleCode: { type: String, default: "", trim: true },
    fabAmount1: { type: String, required: true, trim: true },
    fabricAmount2: { type: String, required: true, trim: true },
    size1: { type: Number, required: true, min: 0 },
    size2: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export type Pattern = InferSchemaType<typeof PatternSchema>;

export default mongoose.models.Pattern || mongoose.model("Pattern", PatternSchema);
