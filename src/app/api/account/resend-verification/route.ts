import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { requireCustomer } from "@/lib/require-customer";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId);
  if (!customer) {
    return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
  }

  if (customer.emailVerified) {
    return NextResponse.json({ success: true, message: "Email is already verified." });
  }

  const verifyToken = randomBytes(32).toString("hex");
  customer.verifyToken = verifyToken;
  customer.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await customer.save();

  await sendVerificationEmail({
    to: customer.email,
    verifyUrl: `${request.nextUrl.origin}/account/verify-email?token=${verifyToken}`,
  });

  return NextResponse.json({ success: true });
}
