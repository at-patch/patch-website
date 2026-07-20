import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { getStripe } from "@/lib/stripe";
import { releaseOrderStock } from "@/lib/inventory";
import { parseJsonBody } from "@/lib/validation";
import { checkoutSessionSchema } from "@/lib/validation/order.schemas";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, checkoutSessionSchema);
  if (!parsed.success) return parsed.response;
  const { orderId } = parsed.data;

  await connectToDatabase();
  const order = await OrderModel.findById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  const origin = request.nextUrl.origin;

  try {
    const stripe = getStripe();

    // Coupon discounts ride along as a one-off Stripe coupon so the Checkout
    // total matches the order total we recorded.
    const discounts =
      order.discount > 0
        ? [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: Math.round(order.discount * 100),
                  currency: order.currency.toLowerCase(),
                  duration: "once",
                  name: order.couponCode || "Discount",
                })
              ).id,
            },
          ]
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: order.currency.toLowerCase(),
      line_items: order.items.map((item: { name: string; price: number }) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      discounts,
      metadata: { orderId: order._id.toString() },
      success_url: `${origin}/checkout/success?order=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    const result = await OrderModel.updateOne(
      { _id: order._id, paymentStatus: "pending" },
      { $set: { paymentStatus: "failed", status: "cancelled" } }
    );
    if (result.modifiedCount > 0) {
      await releaseOrderStock(order);
    }

    const message = error instanceof Error ? error.message : "Failed to start Stripe checkout.";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
