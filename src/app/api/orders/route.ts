import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import ProductModel from "@/lib/models/Product";
import { claimStockForItem, releaseStockForItem } from "@/lib/inventory";
import { claimCoupon, releaseCouponClaim } from "@/lib/coupons";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { generateOrderNumber } from "@/lib/utils";
import { requireCustomer } from "@/lib/require-customer";
import { parseJsonBody } from "@/lib/validation";
import { createOrderSchema } from "@/lib/validation/order.schemas";
import { resolveShippingForWeight } from "@/lib/shipping-quote";
import { convertFromBase, getCurrencySnapshot } from "@/lib/currency";
import type { CreateOrderInput } from "@/types";

type ClaimedItem = {
  productId: string;
  size: string;
  color: string;
};

async function claimProductStock(item: CreateOrderInput["items"][number]) {
  const product = await ProductModel.findById(item.product)
    .select("sku name price images weightKg")
    .lean();
  if (!product) return null;

  const normalizedColor = item.color?.trim() ?? "";
  const claimed = await claimStockForItem(item);
  if (!claimed) return null;

  return {
    price: product.price,
    weightKg: product.weightKg,
    item: {
      product: item.product,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? item.image,
      size: item.size,
      color: normalizedColor,
      weightKg: product.weightKg,
    },
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
  let totalWeightKg = 0;
  const orderItems: CreateOrderInput["items"] = [];
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
      if (!claimed.weightKg || claimed.weightKg <= 0) {
        await revertAllClaims();
        return NextResponse.json(
          { success: false, message: `${claimed.item.name} does not have a valid shipping weight.` },
          { status: 400 }
        );
      }
      totalWeightKg += claimed.weightKg;
      orderItems.push(claimed.item);
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

    const shipping = await resolveShippingForWeight(
      {
        countryCode: body.shippingAddress.countryCode ?? "BD",
        districtSlug: body.shippingAddress.districtSlug ?? body.shippingAddress.citySlug,
        courierClass: body.courierClass,
      },
      totalWeightKg
    );

    if (!shipping) {
      await revertAllClaims();
      return NextResponse.json(
        { success: false, message: "Shipping is not available for this destination." },
        { status: 400 }
      );
    }
    if (shipping.currency !== "BDT") {
      await revertAllClaims();
      return NextResponse.json(
        { success: false, message: "This shipping currency is not available at checkout yet." },
        { status: 400 }
      );
    }

    const currencySnapshot = await getCurrencySnapshot(body.currency ?? "BDT");
    const convertedItems = orderItems.map((item) => ({
      ...item,
      basePrice: item.price,
      price: convertFromBase(item.price, currencySnapshot.rate),
    }));
    const convertedSubtotal = convertedItems.reduce((sum, item) => sum + item.price, 0);
    const convertedShippingCost = convertFromBase(shipping.shippingCost, currencySnapshot.rate);
    const convertedDiscount = convertFromBase(discount, currencySnapshot.rate);

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      customer: customerId ?? undefined,
      items: convertedItems,
      subtotal: convertedSubtotal,
      baseSubtotal: subtotal,
      shippingCost: convertedShippingCost,
      baseShippingCost: shipping.shippingCost,
      totalWeightKg: shipping.totalWeightKg,
      chargeableWeightKg: shipping.chargeableWeightKg,
      shippingRuleId: shipping.shippingRuleId,
      courierClass: shipping.courierClass,
      couponCode: claimedCouponCode ?? "",
      discount: convertedDiscount,
      baseDiscount: discount,
      total: convertedSubtotal + convertedShippingCost - convertedDiscount,
      baseTotal: subtotal + shipping.shippingCost - discount,
      baseCurrency: "BDT",
      currency: currencySnapshot.currency,
      exchangeRate: currencySnapshot.rate,
      exchangeRateTimestamp: currencySnapshot.timestamp,
      exchangeRateSource: currencySnapshot.source,
      shippingAddress: {
        ...body.shippingAddress,
        countryCode: shipping.destination.countryCode,
        district: shipping.destination.district ?? "",
        districtSlug: shipping.destination.districtSlug ?? "",
        shippingCost: convertedShippingCost,
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
