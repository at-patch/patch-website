import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import InventoryItemModel from "@/lib/models/InventoryItem";
import { requireAdmin } from "@/lib/require-admin";
import { generateShortCode } from "@/lib/utils";
import { parseJsonBody } from "@/lib/validation";
import { inventoryItemCreateSchema } from "@/lib/validation/admin-material.schemas";

const STARTER_INVENTORY = [
  {
    itemCode: "INV-1001",
    image: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?fm=jpg&q=80&w=800&auto=format&fit=crop",
    fabricCode: "Fab-001",
    category: "Cut Piece",
    heightInches: 22,
    widthInches: 22,
    quantityPcs: 34,
    description: "Starter cut-piece inventory sample.",
  },
  {
    itemCode: "INV-1002",
    image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?fm=jpg&q=80&w=800&auto=format&fit=crop",
    fabricCode: "Fab-002",
    category: "Cut Piece",
    heightInches: 22,
    widthInches: 19,
    quantityPcs: 8,
    description: "Starter raw-material tracking sample.",
  },
];

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const items = await InventoryItemModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: items, total: items.length });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const existing = await InventoryItemModel.countDocuments({});
  if (existing > 0) {
    return NextResponse.json({ success: false, message: "Inventory already has records." }, { status: 409 });
  }

  const items = await InventoryItemModel.insertMany(STARTER_INVENTORY);
  return NextResponse.json({ success: true, data: items, total: items.length }, { status: 201 });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, inventoryItemCreateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();

  try {
    let item = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const itemCode = generateShortCode("INV");
      try {
        item = await InventoryItemModel.create({ ...parsed.data, itemCode });
        break;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    if (!item) throw new Error("Failed to generate a unique inventory code.");
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create inventory item.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
