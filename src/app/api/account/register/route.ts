import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE, createCustomerToken } from "@/lib/customer-auth";
import CustomerModel from "@/lib/models/Customer";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { name, email, phone, password } = await request.json();

  if (!name || !email || !phone || !password) {
    return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
  }

  const existing = await CustomerModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { success: false, message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await CustomerModel.create({ name, email, phone, passwordHash });

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
