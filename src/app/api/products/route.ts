import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "24");

  const filter: Record<string, unknown> = { status: "available" };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter),
  ]);

  return NextResponse.json({ success: true, data: items, total, page, limit });
}
