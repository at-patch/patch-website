import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";

// Placeholder bKash Payment Gateway integration.
// Requires BKASH_APP_KEY / BKASH_APP_SECRET / BKASH_USERNAME / BKASH_PASSWORD
// from the bKash merchant sandbox before this can call the real Create/Execute Payment APIs.
export async function POST(request: NextRequest) {
  const { orderId } = await request.json();

  if (!process.env.BKASH_APP_KEY) {
    return NextResponse.json(
      {
        success: false,
        message:
          "bKash sandbox credentials are not configured yet. Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD.",
      },
      { status: 501 }
    );
  }

  await connectToDatabase();
  const order = await OrderModel.findById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  // TODO: call bKash Tokenized Checkout Create Payment API and return `bkashURL` for redirect.
  return NextResponse.json(
    { success: false, message: "bKash integration not yet implemented." },
    { status: 501 }
  );
}
