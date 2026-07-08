import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireCustomer } from "@/lib/require-customer";

export async function GET(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const orders = await OrderModel.find({ customer: customerId }).sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: orders, total: orders.length });
}
