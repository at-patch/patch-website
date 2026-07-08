import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import { generateOrderNumber } from "@/lib/utils";
import { requireCustomer } from "@/lib/require-customer";
import type { CreateOrderInput } from "@/types";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const customerId = await requireCustomer(request);
  const body: CreateOrderInput = await request.json();

  if (!body.items?.length) {
    return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });
  }

  const productIds = body.items.map((item) => item.product);
  const products = await ProductModel.find({
    _id: { $in: productIds },
    status: "available",
  });

  if (products.length !== body.items.length) {
    return NextResponse.json(
      { success: false, message: "One or more items are no longer available." },
      { status: 409 }
    );
  }

  const subtotal = products.reduce((sum, p) => sum + p.price, 0);

  try {
    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      customer: customerId ?? undefined,
      items: body.items,
      subtotal,
      total: subtotal,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    await ProductModel.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: "reserved" } }
    );

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
