import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import OrderModel from "@/lib/models/Order";
import { claimGuestOrdersForCustomer } from "@/lib/order-claims";
import { serializeOrderWithImages } from "@/lib/order-response";
import { requireCustomer } from "@/lib/require-customer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId).select("email emailVerified").lean();
  if (!customer) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  if (customer.emailVerified) {
    await claimGuestOrdersForCustomer({
      customerId,
      email: customer.email,
    });
  }

  const { id } = await params;
  const order = await OrderModel.findOne({ _id: id, customer: customerId })
    .populate({ path: "items.product", select: "images" })
    .lean();
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializeOrderWithImages(order) });
}
