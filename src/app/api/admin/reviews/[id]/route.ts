import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const hasProductRef = "productRef" in body;
  const { productRef, ...rest } = body;

  try {
    const update =
      hasProductRef && !productRef ? { ...rest, $unset: { productRef: "" } } : { ...rest, ...(productRef ? { productRef } : {}) };
    const review = await ReviewModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate("productRef", "name slug price currency images");
    if (!review) {
      return NextResponse.json({ success: false, message: "Review not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update review.";
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

  const review = await ReviewModel.findByIdAndDelete(id);
  if (!review) {
    return NextResponse.json({ success: false, message: "Review not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
