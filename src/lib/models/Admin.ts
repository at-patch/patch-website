import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "staff"], default: "staff" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type Admin = InferSchemaType<typeof AdminSchema>;

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
