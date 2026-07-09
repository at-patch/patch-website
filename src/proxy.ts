import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerToken } from "@/lib/customer-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const customerToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const customer = customerToken ? await verifyCustomerToken(customerToken) : null;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = token ? await verifyAdminToken(token) : null;
    if (!admin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/account/login" || pathname === "/account/register") {
    if (customer) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (!customer) {
      return NextResponse.redirect(new URL("/account/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login).*)",
    "/account",
    "/account/login",
    "/account/register",
    "/account/((?!login|register).*)",
  ],
};
