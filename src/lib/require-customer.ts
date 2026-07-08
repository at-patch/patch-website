import { NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerToken } from "@/lib/customer-auth";

export async function requireCustomer(request: NextRequest) {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyCustomerToken(token);
  return payload?.sub ?? null;
}
