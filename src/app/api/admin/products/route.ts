import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "50");

  const [items, total] = await Promise.all([
    ProductModel.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments({}),
  ]);

  return NextResponse.json({ success: true, data: items, total, page, limit });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const product = await ProductModel.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
