import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import "@/lib/models/Product";
import { requireCustomer } from "@/lib/require-customer";

export async function GET(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId).select("wishlist").populate("wishlist").lean();

  return NextResponse.json({ success: true, data: customer?.wishlist ?? [] });
}

export async function POST(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ success: false, message: "productId is required." }, { status: 400 });
  }

  const customer = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $addToSet: { wishlist: productId } },
    { new: true }
  )
    .select("wishlist")
    .populate("wishlist");

  return NextResponse.json({ success: true, data: customer?.wishlist ?? [] }, { status: 201 });
}
