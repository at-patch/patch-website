import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { generateAccountToken } from "@/lib/customer-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("forgot-password", 3, "10 m");

// Always answers with the same message whether or not the account exists,
// so this endpoint can't be used to probe for registered emails.
const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists for that email, a reset link is on its way.",
};

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { email } = await request.json();

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  const customer = await CustomerModel.findOne({ email: email.toLowerCase().trim() });
  if (!customer) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const { token, hash } = generateAccountToken();
  customer.resetTokenHash = hash;
  customer.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await customer.save();

  const resetUrl = `${request.nextUrl.origin}/account/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail({ to: customer.email, resetUrl });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
