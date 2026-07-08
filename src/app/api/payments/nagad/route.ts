import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";

// Placeholder Nagad Payment Gateway integration.
// Requires NAGAD_MERCHANT_ID / NAGAD_MERCHANT_PRIVATE_KEY / NAGAD_PG_PUBLIC_KEY
// from the Nagad merchant sandbox before this can call the real Checkout API.
export async function POST(request: NextRequest) {
  const { orderId } = await request.json();

  if (!process.env.NAGAD_MERCHANT_ID) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Nagad sandbox credentials are not configured yet. Set NAGAD_MERCHANT_ID, NAGAD_MERCHANT_PRIVATE_KEY, NAGAD_PG_PUBLIC_KEY.",
      },
      { status: 501 }
    );
  }

  await connectToDatabase();
  const order = await OrderModel.findById(orderId);
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  // TODO: call Nagad Checkout Initialize + Complete APIs and return redirect URL.
  return NextResponse.json(
    { success: false, message: "Nagad integration not yet implemented." },
    { status: 501 }
  );
}
