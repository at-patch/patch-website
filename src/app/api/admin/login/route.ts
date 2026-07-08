import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { success: false, message: "Admin credentials are not configured on the server." },
      { status: 500 }
    );
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json(
      { success: false, message: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = await createAdminToken(email);

  const response = NextResponse.json({ success: true, data: { email } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
