import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import "@/lib/models/Product";
import { requireCustomer } from "@/lib/require-customer";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { productId } = await params;

  const customer = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $pull: { wishlist: productId } },
    { new: true }
  )
    .select("wishlist")
    .populate("wishlist");

  return NextResponse.json({ success: true, data: customer?.wishlist ?? [] });
}
