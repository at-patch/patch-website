import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { generateAccountToken } from "@/lib/customer-auth";
import { requireCustomer } from "@/lib/require-customer";
import { sendVerificationEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("verify-email-resend", 3, "10 m");

export async function POST(request: NextRequest) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId);
  if (!customer) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  if (customer.emailVerified) {
    return NextResponse.json({ success: true, message: "Your email is already verified." });
  }

  const { token, hash } = generateAccountToken();
  customer.verifyTokenHash = hash;
  customer.verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await customer.save();

  const verifyUrl = `${request.nextUrl.origin}/account/verify-email?token=${token}`;
  try {
    await sendVerificationEmail({ to: customer.email, verifyUrl });
  } catch (error) {
    logError("Failed to send verification email", error, { customerId });
    return NextResponse.json(
      { success: false, message: "Couldn't send the email just now — try again in a bit." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, message: "Verification email sent — check your inbox." });
}
