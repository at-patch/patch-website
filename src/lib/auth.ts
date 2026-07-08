import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "patch_admin_session";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set. Add it to your environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string };
  } catch {
    return null;
  }
}
