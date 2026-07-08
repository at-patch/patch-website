import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE = "patch_customer_session";

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
