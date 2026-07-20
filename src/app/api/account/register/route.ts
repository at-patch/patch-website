import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerToken,
  generateAccountToken,
} from "@/lib/customer-auth";
import CustomerModel from "@/lib/models/Customer";
import { sendVerificationEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { registerSchema } from "@/lib/validation/auth.schemas";

const limiter = makeLimiter("account-register", 5, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, registerSchema);
  if (!parsed.success) return parsed.response;
  const { name, email, phone, password } = parsed.data;

  await connectToDatabase();
  const existing = await CustomerModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { success: false, message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { token: verifyToken, hash: verifyTokenHash } = generateAccountToken();
  const customer = await CustomerModel.create({
    name,
    email,
    phone,
    passwordHash,
    verifyTokenHash,
    verifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Best-effort: registration succeeds even if the email doesn't go out —
  // the account page offers a resend.
  try {
    await sendVerificationEmail({
      to: customer.email,
      verifyUrl: `${request.nextUrl.origin}/account/verify-email?token=${verifyToken}`,
    });
  } catch (error) {
    logError("Failed to send verification email", error, { customerId: customer._id.toString() });
  }

  const token = await createCustomerToken(customer._id.toString());
  const response = NextResponse.json(
    { success: true, data: { name: customer.name, email: customer.email } },
    { status: 201 }
  );
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
