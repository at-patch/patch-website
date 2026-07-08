import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
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
    const product = await ProductModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product.";
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

  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
