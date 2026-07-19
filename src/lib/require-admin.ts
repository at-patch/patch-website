import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth";

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// Gates admin-management routes: only a session with role "owner" passes.
// Sessions issued before roles existed (email-only payload) are rejected —
// that admin needs to log in again to pick up a role.
export async function requireOwnerAdmin(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin || admin.role !== "owner") return null;
  return admin;
}
