import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { releaseOrderStock } from "@/lib/inventory";
import { releaseCouponClaim } from "@/lib/coupons";

let client: Stripe | null = null;

export function getStripe() {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
    }
    client = new Stripe(secretKey);
  }

  return client;
}

// Called from both the webhook (source of truth) and the success page
// (backstop for when the webhook hasn't landed yet) — kept idempotent.
export async function markOrderPaidIfPending(orderId: string, paymentIntentId?: string | null) {
  await connectToDatabase();
  await OrderModel.updateOne(
    { _id: orderId, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "paid",
        status: "confirmed",
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      },
    }
  );
}

// Issues a full refund against the payment intent recorded on the order.
export async function refundStripePayment(paymentIntentId: string) {
  await getStripe().refunds.create({ payment_intent: paymentIntentId });
}

export async function markOrderFailed(orderId: string) {
  await connectToDatabase();
  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending" },
    { $set: { paymentStatus: "failed", status: "cancelled" } }
  );
  if (order) {
    await releaseOrderStock(order);
    if (order.couponCode) await releaseCouponClaim(order.couponCode);
  }
}
