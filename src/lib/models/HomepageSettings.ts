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
    primaryPromo: {
      eyebrow: { type: String, default: "New Drop", trim: true },
      title: { type: String, default: "Color-blocked, cut for confidence.", trim: true },
      body: {
        type: String,
        default: "Bold silhouettes and statement color, styled for how you actually move through your day.",
        trim: true,
      },
      ctaLabel: { type: String, default: "Shop Now", trim: true },
      ctaHref: { type: String, default: "/shop", trim: true },
    },
    secondaryPromo: {
      eyebrow: { type: String, default: "Made in Dhaka", trim: true },
      title: { type: String, default: "Every stitch, done by hand.", trim: true },
      body: {
        type: String,
        default: "Small studio team, careful finishing, a little less waste along the way — fashion that's made thoughtfully.",
        trim: true,
      },
      ctaLabel: { type: String, default: "See the Process", trim: true },
      ctaHref: { type: String, default: "/story", trim: true },
    },
    productBatches: { type: [HomepageBatchSchema], default: [] },
  },
  { timestamps: true }
);

export type HomepageSettings = InferSchemaType<typeof HomepageSettingsSchema>;

export default mongoose.models.HomepageSettings ||
  mongoose.model("HomepageSettings", HomepageSettingsSchema);
