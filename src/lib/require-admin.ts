import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth";

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
