import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { serializeOrderWithImages } from "@/lib/order-response";
import { getStripe, markOrderPaidIfPending } from "@/lib/stripe";
import { ClearCartOnMount } from "@/components/store/ClearCartOnMount";
import { OrderInvoice } from "@/components/orders/OrderInvoice";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

async function getOrder(orderNumber: string): Promise<Order | null> {
  await connectToDatabase();
  const order = await OrderModel.findOne({ orderNumber })
    .populate({ path: "items.product", select: "images" })
    .lean();
  return order ? serializeOrderWithImages(order) : null;
}

// Backstop alongside the Stripe webhook, in case it hasn't landed yet by the
// time the customer is redirected back here.
async function confirmStripeSession(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId;
  if (orderId && session.payment_status === "paid") {
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    await markOrderPaidIfPending(orderId, paymentIntentId);
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const { order: orderNumber, session_id: sessionId } = await searchParams;

  if (sessionId) {
    await confirmStripeSession(sessionId);
  }

  const order = orderNumber ? await getOrder(orderNumber) : null;

  const message = (() => {
    if (!order) {
      return "Thank you — we've received your order. The Patch team will confirm payment and reach out with shipping details shortly.";
    }
    if (order.paymentMethod === "cod") {
      return "Thank you — your order is confirmed. Please have the total ready in cash on delivery.";
    }
    if (order.paymentStatus === "paid") {
      return "Payment received — thank you! We'll reach out with shipping details shortly.";
    }
    if (order.paymentStatus === "failed") {
      return "We couldn't confirm your payment. Please try again or contact us for help.";
    }
    return "We're confirming your payment now — this can take a few moments. We'll email you once it's confirmed.";
  })();

  return (
    <div>
      <ClearCartOnMount />
      <div className="mx-auto max-w-lg px-6 pt-20 text-center">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Order placed</h1>
        <p className="mt-3 text-sm text-patch-ink-muted">
          {message}
          {orderNumber ? ` (Order ${orderNumber})` : ""}
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
      {order && <OrderInvoice order={order} />}
    </div>
  );
}
