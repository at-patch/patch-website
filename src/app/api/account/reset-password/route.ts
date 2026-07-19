import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { hashAccountToken } from "@/lib/customer-auth";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("reset-password", 5, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { token, password } = await request.json();

  if (typeof token !== "string" || !token || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

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
