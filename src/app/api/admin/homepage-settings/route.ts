import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import HomepageSettingsModel from "@/lib/models/HomepageSettings";
import ProductBatchModel from "@/lib/models/ProductBatch";
import { requireAdmin } from "@/lib/require-admin";

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

async function getSettings() {
  const settings = await HomepageSettingsModel.findOneAndUpdate(
    { key: "homepage" },
    { $setOnInsert: { key: "homepage", productBatches: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate({ path: "productBatches.batch", model: ProductBatchModel })
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

  await connectToDatabase();
  const body = await request.json();
  const productBatches = sanitizeRows((body as Record<string, unknown>).productBatches);

  const settings = await HomepageSettingsModel.findOneAndUpdate(
    { key: "homepage" },
    { $set: { productBatches }, $setOnInsert: { key: "homepage" } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate({ path: "productBatches.batch", model: ProductBatchModel })
    .lean();

  return NextResponse.json({ success: true, data: settings });
}
