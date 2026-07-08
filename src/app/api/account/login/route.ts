import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE, createCustomerToken } from "@/lib/customer-auth";
import CustomerModel from "@/lib/models/Customer";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("account-login", 5, "60 s");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  await connectToDatabase();
  const { email, password } = await request.json();

  const customer = await CustomerModel.findOne({ email: email?.toLowerCase() });
  if (!customer) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }

  const token = await createCustomerToken(customer._id.toString());
  const response = NextResponse.json({ success: true, data: { name: customer.name, email: customer.email } });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
