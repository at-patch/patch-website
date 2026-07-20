import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import ProductBatchModel from "@/lib/models/ProductBatch";
import ProductModel from "@/lib/models/Product";
import { requireAdmin } from "@/lib/require-admin";
import { escapeRegex } from "@/lib/utils";

function objectIdsFrom(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((id): id is string => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

function sanitizeBatchInput(body: Record<string, unknown>) {
  return {
    title: typeof body.title === "string" ? body.title.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    products: objectIdsFrom(body.products),
    active: typeof body.active === "boolean" ? body.active : true,
  };
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const productSearch = searchParams.get("productSearch")?.trim();

  if (productSearch) {
    const regex = { $regex: escapeRegex(productSearch), $options: "i" };
    const products = await ProductModel.find({ $or: [{ name: regex }, { sku: regex }, { slug: regex }] })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, data: products, total: products.length, page: 1, limit: 20 });
  }

  const items = await ProductBatchModel.find({})
    .sort({ createdAt: -1 })
    .populate({ path: "products", model: ProductModel })
    .lean();

  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const payload = sanitizeBatchInput(body);

  if (!payload.title) {
    return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
  }

  try {
    const batch = await ProductBatchModel.create(payload);
    const populated = await batch.populate({ path: "products", model: ProductModel });
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product batch.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
