import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import { requireAdmin } from "@/lib/require-admin";
import type { OrderItem } from "@/types";

async function getProductRarity(productId: string) {
  const product = await ProductModel.findById(productId).select("rarity").lean();
  return product?.rarity === "multi-quantity" ? "multi-quantity" : "one-of-one";
}

async function markOrderItemsAvailable(items: OrderItem[]) {
  for (const item of items) {
    const rarity = await getProductRarity(item.product);

    if (rarity === "multi-quantity") {
      await ProductModel.updateOne(
        {
          _id: item.product,
          variants: {
            $elemMatch: {
              size: item.size,
              color: item.color ?? "",
            },
          },
        },
        { $inc: { "variants.$.quantity": 1 } }
      );
      continue;
    }

    await ProductModel.updateOne({ _id: item.product }, { $set: { status: "available" } });
  }
}

async function markOrderItemsSold(items: OrderItem[]) {
  for (const item of items) {
    const rarity = await getProductRarity(item.product);
    if (rarity === "multi-quantity") continue;
    await ProductModel.updateOne({ _id: item.product }, { $set: { status: "sold" } });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const existingOrder = await OrderModel.findById(id);
  if (!existingOrder) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  const nextStatus = body.status;
  const statusChanged = nextStatus && nextStatus !== existingOrder.status;

  const order = await OrderModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  if (statusChanged && (nextStatus === "shipped" || nextStatus === "delivered")) {
    await markOrderItemsSold(order.items as OrderItem[]);
  }

  if (statusChanged && nextStatus === "cancelled") {
    await markOrderItemsAvailable(order.items as OrderItem[]);
  }

  return NextResponse.json({ success: true, data: order });
}
