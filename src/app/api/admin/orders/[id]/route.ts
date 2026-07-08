import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
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

  const order = await OrderModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  if (body.status === "shipped" || body.status === "delivered") {
    await ProductModel.updateMany(
      { _id: { $in: order.items.map((i: { product: unknown }) => i.product) } },
      { $set: { status: "sold" } }
    );
  }

  if (body.status === "cancelled") {
    await ProductModel.updateMany(
      { _id: { $in: order.items.map((i: { product: unknown }) => i.product) } },
      { $set: { status: "available" } }
    );
  }

  return NextResponse.json({ success: true, data: order });
}
