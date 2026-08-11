import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ success: false, message: "Token is required." }, { status: 400 });
  }

  const customer = await CustomerModel.findOne({
    verifyToken: token,
    verifyTokenExpiry: { $gt: new Date() },
  });

  if (!customer) {
    return NextResponse.json({ success: false, message: "Invalid or expired verification link." }, { status: 400 });
  }

  customer.emailVerified = true;
  customer.verifyToken = undefined;
  customer.verifyTokenExpiry = undefined;
  await customer.save();

  return NextResponse.json({ success: true });
}
