import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CUSTOMER_PRIVATE_FIELDS, CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
import CustomerModel from "@/lib/models/Customer";
import { requireCustomer } from "@/lib/require-customer";

export async function GET(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId).select(CUSTOMER_PRIVATE_FIELDS);
  if (!customer) {
    const response = NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    response.cookies.delete(CUSTOMER_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json({ success: true, data: customer });
}

export async function PATCH(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { name, phone } = await request.json();

  const customer = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $set: { name, phone } },
    { new: true, runValidators: true }
  ).select(CUSTOMER_PRIVATE_FIELDS);

  if (!customer) {
    const response = NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    response.cookies.delete(CUSTOMER_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json({ success: true, data: customer });
}
