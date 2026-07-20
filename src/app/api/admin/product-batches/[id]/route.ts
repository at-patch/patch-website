import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import HomepageSettingsModel from "@/lib/models/HomepageSettings";
import ProductBatchModel from "@/lib/models/ProductBatch";
import ProductModel from "@/lib/models/Product";
import { requireAdmin } from "@/lib/require-admin";

function objectIdsFrom(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((id): id is string => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

function sanitizeBatchInput(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if (typeof body.title === "string") payload.title = body.title.trim();
  if (typeof body.description === "string") payload.description = body.description.trim();
  if (Array.isArray(body.products)) payload.products = objectIdsFrom(body.products);
  if (typeof body.active === "boolean") payload.active = body.active;

  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();
  const payload = sanitizeBatchInput(body);

  if ("title" in payload && !payload.title) {
    return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
  }

  try {
    const batch = await ProductBatchModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .populate({ path: "products", model: ProductModel });

    if (!batch) {
      return NextResponse.json({ success: false, message: "Product batch not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product batch.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const batch = await ProductBatchModel.findByIdAndDelete(id);
  if (!batch) {
    return NextResponse.json({ success: false, message: "Product batch not found." }, { status: 404 });
  }

  await HomepageSettingsModel.updateMany(
    {},
    { $pull: { productBatches: { batch: new mongoose.Types.ObjectId(id) } } }
  );

  return NextResponse.json({ success: true, data: null });
}
