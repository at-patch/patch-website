import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { hashAccountToken } from "@/lib/customer-auth";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { resetPasswordSchema } from "@/lib/validation/auth.schemas";

const limiter = makeLimiter("reset-password", 5, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, resetPasswordSchema);
  if (!parsed.success) return parsed.response;
  const { token, password } = parsed.data;

  await connectToDatabase();
  const customer = await CustomerModel.findOne({
    resetTokenHash: hashAccountToken(token),
    resetTokenExpiresAt: { $gt: new Date() },
  });

  if (!customer) {
    return NextResponse.json(
      { success: false, message: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  customer.passwordHash = await bcrypt.hash(password, 10);
  customer.resetTokenHash = "";
  customer.resetTokenExpiresAt = null;
  // A working reset link proves control of the inbox.
  customer.emailVerified = true;
  await customer.save();

  return NextResponse.json({ success: true, message: "Password updated — you can sign in now." });
}
