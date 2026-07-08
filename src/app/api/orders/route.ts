import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import { generateOrderNumber } from "@/lib/utils";
import { requireCustomer } from "@/lib/require-customer";
import type { CreateOrderInput } from "@/types";

type ClaimedItem = {
  productId: string;
  rarity: "one-of-one" | "multi-quantity";
  size: string;
  color: string;
};

async function claimProductStock(item: CreateOrderInput["items"][number]) {
  const product = await ProductModel.findById(item.product).select("price rarity").lean();
  if (!product) return null;

  const rarity = product.rarity === "multi-quantity" ? "multi-quantity" : "one-of-one";
  const normalizedColor = item.color?.trim() ?? "";

  if (rarity === "multi-quantity") {
    const claimed = await ProductModel.findOneAndUpdate(
      {
        _id: item.product,
        variants: {
          $elemMatch: {
            size: item.size,
            color: normalizedColor,
            quantity: { $gte: 1 },
          },
        },
      },
      { $inc: { "variants.$.quantity": -1 } },
      { new: true }
    )
      .select("_id")
      .lean();

    if (!claimed) return null;

    return {
      price: product.price,
      claim: {
        productId: String(item.product),
        rarity,
        size: item.size,
        color: normalizedColor,
      } satisfies ClaimedItem,
    };
  }

  const claimed = await ProductModel.findOneAndUpdate(
    { _id: item.product, status: "available" },
    { $set: { status: "reserved" } },
    { new: true }
  )
    .select("_id")
    .lean();

  if (!claimed) return null;

  return {
    price: product.price,
    claim: {
      productId: String(item.product),
      rarity,
      size: item.size,
      color: normalizedColor,
    } satisfies ClaimedItem,
  };
}

async function revertClaim(claim: ClaimedItem) {
  if (claim.rarity === "multi-quantity") {
    await ProductModel.updateOne(
      {
        _id: claim.productId,
        variants: { $elemMatch: { size: claim.size, color: claim.color } },
      },
      { $inc: { "variants.$.quantity": 1 } }
    );
    return;
  }

  await ProductModel.updateOne({ _id: claim.productId }, { $set: { status: "available" } });
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
