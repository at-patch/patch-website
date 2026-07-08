import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CategoryModel from "@/lib/models/Category";
import { requireAdmin } from "@/lib/require-admin";

const DEFAULT_CATEGORIES = [
  { name: "Outerwear", slug: "outerwear", order: 0 },
  { name: "Tops", slug: "tops", order: 1 },
  { name: "Bottoms", slug: "bottoms", order: 2 },
  { name: "Dresses", slug: "dresses", order: 3 },
  { name: "Accessories", slug: "accessories", order: 4 },
];

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();

  const count = await CategoryModel.countDocuments({});
  if (count === 0) {
    await CategoryModel.insertMany(DEFAULT_CATEGORIES);
  }

  const items = await CategoryModel.find({}).sort({ order: 1 });
  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const category = await CategoryModel.create(body);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
