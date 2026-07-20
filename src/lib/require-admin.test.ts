import { beforeAll, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

beforeAll(() => {
  process.env.ADMIN_JWT_SECRET = "test-admin-secret";
});

function requestWithCookie(token: string | undefined) {
  return {
    cookies: { get: () => (token === undefined ? undefined : { value: token }) },
  } as unknown as NextRequest;
}

describe("requireAdmin", () => {
  it("returns null when there is no session cookie", async () => {
    const { requireAdmin } = await import("./require-admin");
    expect(await requireAdmin(requestWithCookie(undefined))).toBeNull();
  });

  it("returns the payload for a valid token regardless of role", async () => {
    const { createAdminToken } = await import("./auth");
    const { requireAdmin } = await import("./require-admin");
    const token = await createAdminToken({ sub: "1", email: "staff@patch.test", role: "staff" });
    const admin = await requireAdmin(requestWithCookie(token));
    expect(admin?.email).toBe("staff@patch.test");
  });
});

describe("requireOwnerAdmin", () => {
  it("passes an owner session", async () => {
    const { createAdminToken } = await import("./auth");
    const { requireOwnerAdmin } = await import("./require-admin");
    const token = await createAdminToken({ sub: "1", email: "owner@patch.test", role: "owner" });
    const admin = await requireOwnerAdmin(requestWithCookie(token));
    expect(admin?.role).toBe("owner");
  });

  it("rejects a staff session", async () => {
    const { createAdminToken } = await import("./auth");
    const { requireOwnerAdmin } = await import("./require-admin");
    const token = await createAdminToken({ sub: "1", email: "staff@patch.test", role: "staff" });
    expect(await requireOwnerAdmin(requestWithCookie(token))).toBeNull();
  });

  it("rejects a legacy token that has no role at all", async () => {
    const { SignJWT } = await import("jose");
    const { requireOwnerAdmin } = await import("./require-admin");
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    const legacyToken = await new SignJWT({ email: "owner@patch.test" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    expect(await requireOwnerAdmin(requestWithCookie(legacyToken))).toBeNull();
  });

  it("rejects when there is no session at all", async () => {
    const { requireOwnerAdmin } = await import("./require-admin");
    expect(await requireOwnerAdmin(requestWithCookie(undefined))).toBeNull();
  });
});
