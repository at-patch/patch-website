import { describe, expect, it } from "vitest";
import { adminOrderUpdateSchema, checkoutSessionSchema, createOrderSchema } from "./order.schemas";

const validItem = {
  product: "prod-1",
  sku: "SKU-1",
  name: "Denim Jacket",
  price: 1500,
  size: "M",
};

const validAddress = {
  fullName: "Ada Lovelace",
  phone: "01712345678",
  email: "ada@example.com",
  addressLine: "123 Main St",
  city: "Dhaka",
  citySlug: "dhaka",
};

describe("createOrderSchema", () => {
  it("accepts a well-formed order", () => {
    const result = createOrderSchema.safeParse({
      items: [validItem],
      shippingAddress: validAddress,
      paymentMethod: "card",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    const result = createOrderSchema.safeParse({
      items: [],
      shippingAddress: validAddress,
      paymentMethod: "card",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a size outside the known SIZES enum", () => {
    const result = createOrderSchema.safeParse({
      items: [{ ...validItem, size: "XXXXL" }],
      shippingAddress: validAddress,
      paymentMethod: "card",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown payment method", () => {
    const result = createOrderSchema.safeParse({
      items: [validItem],
      shippingAddress: validAddress,
      paymentMethod: "crypto",
    });
    expect(result.success).toBe(false);
  });

  it("rejects cash on delivery now that Stripe is the only live checkout method", () => {
    const result = createOrderSchema.safeParse({
      items: [validItem],
      shippingAddress: validAddress,
      paymentMethod: "cod",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes Bangladesh phone numbers", () => {
    const result = createOrderSchema.safeParse({
      items: [validItem],
      shippingAddress: { ...validAddress, phone: "01712-345678" },
      paymentMethod: "card",
    });
    expect(result.success && result.data.shippingAddress.phone).toBe("+8801712345678");
  });

  it("rejects non-Bangladesh phone numbers", () => {
    const result = createOrderSchema.safeParse({
      items: [validItem],
      shippingAddress: { ...validAddress, phone: "+15555555555" },
      paymentMethod: "card",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSessionSchema", () => {
  it("rejects an empty orderId", () => {
    expect(checkoutSessionSchema.safeParse({ orderId: "" }).success).toBe(false);
  });
});

describe("adminOrderUpdateSchema", () => {
  it("strips fields that aren't part of the allowed update surface", () => {
    const result = adminOrderUpdateSchema.safeParse({
      status: "shipped",
      total: 999999,
      paymentMethod: "cod",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ status: "shipped" });
      expect(result.data).not.toHaveProperty("total");
      expect(result.data).not.toHaveProperty("paymentMethod");
    }
  });

  it("accepts an empty object since every field is optional", () => {
    expect(adminOrderUpdateSchema.safeParse({}).success).toBe(true);
  });
});
