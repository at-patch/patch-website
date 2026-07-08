import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { requireCustomer } from "@/lib/require-customer";

export async function GET(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId).select("-passwordHash");
  if (!customer) return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });

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
  ).select("-passwordHash");

  return NextResponse.json({ success: true, data: customer });
}
