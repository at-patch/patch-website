import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schemas";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      phone: "0123456789",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      phone: "0123456789",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      phone: "0123456789",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = registerSchema.safeParse({
      email: "ada@example.com",
      phone: "0123456789",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires both a token and an 8+ character password", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "longenough" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", password: "longenough" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "short" }).success).toBe(false);
  });
});
