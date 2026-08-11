import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { sendPasswordResetEmail } from "@/lib/email";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("forgot-password", 5, "10 m");

const GENERIC_MESSAGE = "If an account with that email exists, we've sent a reset link.";

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { email } = await request.json();

  const customer = email ? await CustomerModel.findOne({ email: email.toLowerCase() }) : null;

  if (customer) {
    const resetToken = randomBytes(32).toString("hex");
    customer.resetToken = resetToken;
    customer.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await customer.save();

    const origin = request.nextUrl.origin;
    try {
      await sendPasswordResetEmail({
        to: customer.email,
        resetUrl: `${origin}/account/reset-password?token=${resetToken}`,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
}
