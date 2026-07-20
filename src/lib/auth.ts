import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@/types";

export const ADMIN_SESSION_COOKIE = "patch_admin_session";

export interface AdminSessionPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set. Add it to your environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(payload: AdminSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

// Tokens issued before roles existed only carry `email` — callers that only
// gate on truthiness keep working, but role-gated routes (admin management)
// require re-authenticating once to pick up `sub`/`role`.
export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as Partial<AdminSessionPayload> & { email: string };
  } catch {
    return null;
  }
}
