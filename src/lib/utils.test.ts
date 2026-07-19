import { describe, expect, it } from "vitest";
import { escapeRegex, formatPrice, generateOrderNumber, getTotalQuantity, isValidImageSrc } from "./utils";

describe("formatPrice", () => {
  it("formats with the default BDT currency", () => {
    expect(formatPrice(1500)).toBe("BDT 1,500");
  });

  it("formats with a custom currency", () => {
    expect(formatPrice(20, "USD")).toBe("USD 20");
  });
});

describe("generateOrderNumber", () => {
  it("produces a PATCH-prefixed, unique-looking order number", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).toMatch(/^PATCH-[0-9A-Z]+-[0-9A-Z]{4}$/);
    expect(a).not.toBe(b);
  });
});

describe("escapeRegex", () => {
  it("escapes regex special characters so they match literally", () => {
    const escaped = escapeRegex("a.b*c?");
    expect(new RegExp(escaped).test("a.b*c?")).toBe(true);
    expect(new RegExp(escaped).test("aXbYcZ")).toBe(false);
  });
});

describe("isValidImageSrc", () => {
  it("accepts root-relative paths", () => {
    expect(isValidImageSrc("/images/foo.jpg")).toBe(true);
  });

  it("accepts absolute http(s) URLs", () => {
    expect(isValidImageSrc("https://res.cloudinary.com/foo.jpg")).toBe(true);
  });

  it("rejects empty or non-URL values", () => {
    expect(isValidImageSrc(undefined)).toBe(false);
    expect(isValidImageSrc("")).toBe(false);
    expect(isValidImageSrc("not a url")).toBe(false);
  });
});

describe("getTotalQuantity", () => {
  it("returns 1 for an available one-of-one product", () => {
    expect(getTotalQuantity({ rarity: "one-of-one", status: "available", variants: [] })).toBe(1);
  });

  it("returns 0 for a sold one-of-one product", () => {
    expect(getTotalQuantity({ rarity: "one-of-one", status: "sold", variants: [] })).toBe(0);
  });

  it("sums variant quantities for multi-quantity products", () => {
    expect(
      getTotalQuantity({
        rarity: "multi-quantity",
        status: "available",
        variants: [
          { size: "M", color: "black", quantity: 3 },
          { size: "L", color: "black", quantity: 2 },
        ],
      })
    ).toBe(5);
  });

  it("ignores negative variant quantities instead of subtracting", () => {
    expect(
      getTotalQuantity({
        rarity: "multi-quantity",
        status: "available",
        variants: [{ size: "M", color: "black", quantity: -1 }],
      })
    ).toBe(0);
  });
});
