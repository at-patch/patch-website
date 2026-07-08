import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import InventoryItemModel from "@/lib/models/InventoryItem";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const items = await InventoryItemModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: items, total: items.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const item = await InventoryItemModel.create(body);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create inventory item.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
