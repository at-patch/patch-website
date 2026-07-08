import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { requireCustomer } from "@/lib/require-customer";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { addressId } = await params;

  const customer = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  ).select("-passwordHash");

  return NextResponse.json({ success: true, data: customer });
}
