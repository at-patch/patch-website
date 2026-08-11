import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import HomepageSettingsModel from "@/lib/models/HomepageSettings";
import ProductBatchModel from "@/lib/models/ProductBatch";
import { requireAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { homepageSettingsUpdateSchema } from "@/lib/validation/cms.schemas";

function sanitizeRows(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();

  return value.flatMap((row, index) => {
    if (!row || typeof row !== "object") return [];

    const record = row as Record<string, unknown>;
    const rawBatch = record.batch;
    const batchId =
      typeof rawBatch === "string"
        ? rawBatch
        : rawBatch && typeof rawBatch === "object" && "_id" in rawBatch && typeof rawBatch._id === "string"
          ? rawBatch._id
          : "";

    if (!mongoose.Types.ObjectId.isValid(batchId) || seen.has(batchId)) return [];
    seen.add(batchId);

    return [{
      batch: new mongoose.Types.ObjectId(batchId),
      enabled: typeof record.enabled === "boolean" ? record.enabled : true,
      order: Number.isFinite(Number(record.order)) ? Number(record.order) : index,
    }];
  }).sort((a, b) => a.order - b.order).map((row, index) => ({ ...row, order: index }));
}

const BATCH_POPULATE = [
  { path: "productBatches.batch", model: ProductBatchModel },
  { path: "shopBatches.batch", model: ProductBatchModel },
];

async function getSettings() {
  const settings = await HomepageSettingsModel.findOneAndUpdate(
    { key: "homepage" },
    { $setOnInsert: { key: "homepage", productBatches: [], shopBatches: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate(BATCH_POPULATE)
    .lean();

  return settings;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const settings = await getSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, homepageSettingsUpdateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  // Each placement is only rewritten when the caller actually sends it, so an
  // editor that saves one placement cannot wipe the other.
  const update: Record<string, unknown> = {};
  if (parsed.data.productBatches) update.productBatches = sanitizeRows(parsed.data.productBatches);
  if (parsed.data.shopBatches) update.shopBatches = sanitizeRows(parsed.data.shopBatches);
  if (parsed.data.primaryPromo) update.primaryPromo = parsed.data.primaryPromo;
  if (parsed.data.secondaryPromo) update.secondaryPromo = parsed.data.secondaryPromo;

  const settings = await HomepageSettingsModel.findOneAndUpdate(
    { key: "homepage" },
    {
      $set: update,
      $setOnInsert: { key: "homepage" },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate(BATCH_POPULATE)
    .lean();

  return NextResponse.json({ success: true, data: settings });
}
