import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: orders, total: orders.length });
}
