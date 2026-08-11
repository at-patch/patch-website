import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("reset-password", 5, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ success: false, message: "Token and password are required." }, { status: 400 });
  }

  const customer = await CustomerModel.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!customer) {
    return NextResponse.json({ success: false, message: "Invalid or expired reset link." }, { status: 400 });
  }

  customer.passwordHash = await bcrypt.hash(password, 10);
  customer.resetToken = undefined;
  customer.resetTokenExpiry = undefined;
  await customer.save();

  return NextResponse.json({ success: true });
}
