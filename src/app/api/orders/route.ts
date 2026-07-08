import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import { claimStockForItem, releaseStockForItem } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/utils";
import { requireCustomer } from "@/lib/require-customer";
import type { CreateOrderInput } from "@/types";

type ClaimedItem = {
  productId: string;
  size: string;
  color: string;
};

async function claimProductStock(item: CreateOrderInput["items"][number]) {
  const product = await ProductModel.findById(item.product).select("price").lean();
  if (!product) return null;

  const normalizedColor = item.color?.trim() ?? "";
  const claimed = await claimStockForItem(item);
  if (!claimed) return null;

  return {
    price: product.price,
    claim: {
      productId: String(item.product),
      size: item.size,
      color: normalizedColor,
    } satisfies ClaimedItem,
  };
}

async function revertClaim(claim: ClaimedItem) {
  await releaseStockForItem({ product: claim.productId, size: claim.size, color: claim.color });
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const customerId = await requireCustomer(request);
  const body: CreateOrderInput = await request.json();

  if (!body.items?.length) {
    return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });
  }

  const claims: ClaimedItem[] = [];
  let subtotal = 0;

  try {
    for (const item of body.items) {
      const claimed = await claimProductStock(item);

      if (!claimed) {
        await Promise.all(claims.map((claim) => revertClaim(claim)));
        return NextResponse.json(
          { success: false, message: "One or more items are no longer available." },
          { status: 409 }
        );
      }

      claims.push(claimed.claim);
      subtotal += claimed.price;
    }

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      customer: customerId ?? undefined,
      items: body.items,
      subtotal,
      total: subtotal,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    await Promise.all(claims.map((claim) => revertClaim(claim)));
    const message = error instanceof Error ? error.message : "Failed to create order.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
