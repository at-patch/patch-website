import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { requireCustomer } from "@/lib/require-customer";

export async function POST(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const address = await request.json();

  const customer = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $push: { addresses: address } },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  return NextResponse.json({ success: true, data: customer }, { status: 201 });
}
