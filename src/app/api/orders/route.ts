import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import ShippingCityModel from "@/lib/models/ShippingCity";
import { claimStockForItem, releaseStockForItem } from "@/lib/inventory";
import { claimCoupon, releaseCouponClaim } from "@/lib/coupons";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { generateOrderNumber } from "@/lib/utils";
import { requireCustomer } from "@/lib/require-customer";
import { parseJsonBody } from "@/lib/validation";
import { createOrderSchema } from "@/lib/validation/order.schemas";
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
  const parsed = await parseJsonBody(request, createOrderSchema);
  if (!parsed.success) return parsed.response;
  const body: CreateOrderInput = parsed.data;

  await connectToDatabase();
  const customerId = await requireCustomer(request);

  const claims: ClaimedItem[] = [];
  let subtotal = 0;
  let claimedCouponCode: string | null = null;

  const revertAllClaims = async () => {
    await Promise.all(claims.map((claim) => revertClaim(claim)));
    if (claimedCouponCode) await releaseCouponClaim(claimedCouponCode);
  };

  try {
    for (const item of body.items) {
      const claimed = await claimProductStock(item);

      if (!claimed) {
        await revertAllClaims();
        return NextResponse.json(
          { success: false, message: "One or more items are no longer available." },
          { status: 409 }
        );
      }

      claims.push(claimed.claim);
      subtotal += claimed.price;
    }

    let discount = 0;
    if (body.couponCode?.trim()) {
      const coupon = await claimCoupon(body.couponCode, subtotal);
      if (!coupon.ok) {
        await revertAllClaims();
        return NextResponse.json({ success: false, message: coupon.message }, { status: 400 });
      }
      claimedCouponCode = coupon.code;
      discount = coupon.discount;
    }

    const shippingCity = await ShippingCityModel.findOne({
      slug: body.shippingAddress.citySlug,
      isActive: true,
    }).lean();

    if (!shippingCity) {
      await revertAllClaims();
      return NextResponse.json({ success: false, message: "Select an active shipping city." }, { status: 400 });
    }

    const shippingCost = shippingCity.shippingCost;

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      customer: customerId ?? undefined,
      items: body.items,
      subtotal,
      shippingCost,
      couponCode: claimedCouponCode ?? "",
      discount,
      total: subtotal + shippingCost - discount,
      shippingAddress: {
        ...body.shippingAddress,
        city: shippingCity.name,
        citySlug: shippingCity.slug,
        shippingCost,
      },
      paymentMethod: body.paymentMethod,
    });

    try {
      await sendOrderConfirmationEmail({
        to: order.shippingAddress.email,
        order: JSON.parse(JSON.stringify(order)),
      });
    } catch (emailError) {
      logError("Failed to send order confirmation email", emailError, { orderId: order._id.toString() });
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    await revertAllClaims();
    const message = error instanceof Error ? error.message : "Failed to create order.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
