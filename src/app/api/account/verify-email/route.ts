import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CustomerModel from "@/lib/models/Customer";
import { hashAccountToken } from "@/lib/customer-auth";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("verify-email", 10, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { token } = await request.json();

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ success: false, message: "Verification token is missing." }, { status: 400 });
  }

  const customer = await CustomerModel.findOneAndUpdate(
    {
      verifyTokenHash: hashAccountToken(token),
      verifyTokenExpiresAt: { $gt: new Date() },
    },
    { $set: { emailVerified: true, verifyTokenHash: "", verifyTokenExpiresAt: null } },
    { new: true }
  );

  if (!customer) {
    return NextResponse.json(
      { success: false, message: "This verification link is invalid or has expired. Request a new one from your account page." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, message: "Email verified — thanks!" });
}
