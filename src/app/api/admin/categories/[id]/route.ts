import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CategoryModel from "@/lib/models/Category";
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

  try {
    const category = await CategoryModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category.";
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

  const category = await CategoryModel.findByIdAndDelete(id);
  if (!category) {
    return NextResponse.json({ success: false, message: "Category not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
