import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE = "patch_customer_session";

// Fields that must never leave the server — keep in sync with the token
// fields on the Customer model.
export const CUSTOMER_PRIVATE_FIELDS =
  "-passwordHash -resetTokenHash -resetTokenExpiresAt -verifyTokenHash -verifyTokenExpiresAt";

// One-time account tokens (password reset / email verification): the raw
// token goes into the email link, only its hash is stored.
export function generateAccountToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashAccountToken(token) };
}

export function hashAccountToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSecret() {
  const secret = process.env.CUSTOMER_JWT_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_JWT_SECRET is not set. Add it to your environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export async function createCustomerToken(customerId: string) {
  return new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyCustomerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string };
  } catch {
    return null;
  }
}
