import mongoose, { Schema, type InferSchemaType } from "mongoose";

const HomepageBatchSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "ProductBatch", required: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const HomepageSettingsSchema = new Schema(
  {
    key: { type: String, default: "homepage", unique: true, immutable: true },
    productBatches: { type: [HomepageBatchSchema], default: [] },
  },
  { timestamps: true }
);

export type HomepageSettings = InferSchemaType<typeof HomepageSettingsSchema>;

export default mongoose.models.HomepageSettings ||
  mongoose.model("HomepageSettings", HomepageSettingsSchema);
