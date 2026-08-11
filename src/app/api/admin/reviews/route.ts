import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const items = await ReviewModel.find({})
    .sort({ order: 1, createdAt: -1 })
    .populate("productRef", "name slug price currency images");

  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const review = await ReviewModel.create({ ...body, productRef: body.productRef || undefined });
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
