import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { generateAccountToken } from "@/lib/customer-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { forgotPasswordSchema } from "@/lib/validation/auth.schemas";

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

  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if (!parsed.success) return parsed.response;
  const { email } = parsed.data;

  await connectToDatabase();
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
    logError("Failed to send password reset email", error, { customerId: customer._id.toString() });
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
