import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import InventoryItemModel from "@/lib/models/InventoryItem";
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
    const item = await InventoryItemModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return NextResponse.json({ success: false, message: "Inventory item not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update inventory item.";
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

  const item = await InventoryItemModel.findByIdAndDelete(id);
  if (!item) {
    return NextResponse.json({ success: false, message: "Inventory item not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
