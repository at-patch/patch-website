import { describe, expect, it } from "vitest";
import { productCreateSchema, productUpdateSchema } from "./admin-product.schemas";

const validProduct = {
  sku: "PATCH-001",
  name: "Patch Jacket",
  slug: "patch-jacket",
  description: "A limited-run jacket.",
  images: ["https://example.com/jacket.jpg"],
  sizeChartImage: "https://example.com/size-chart.jpg",
  price: 4500,
  weightKg: 0.8,
  category: "outerwear",
  materials: ["denim"],
  rarity: "multi-quantity" as const,
  size: "M" as const,
  variants: [{ size: "M" as const, color: "Indigo", quantity: 2 }],
};

describe("productCreateSchema", () => {
  it("accepts product weight and a product-specific size chart", () => {
    expect(productCreateSchema.safeParse(validProduct).success).toBe(true);
  });

  it("requires a positive weight for new products", () => {
    expect(productCreateSchema.safeParse({ ...validProduct, weightKg: 0 }).success).toBe(false);
  });

  it("requires variants for multi-quantity products", () => {
    expect(productCreateSchema.safeParse({ ...validProduct, variants: [] }).success).toBe(false);
  });
});

describe("productUpdateSchema", () => {
  it("allows focused status and size-chart updates", () => {
    expect(productUpdateSchema.safeParse({ status: "archived" }).success).toBe(true);
    expect(productUpdateSchema.safeParse({ sizeChartImage: "" }).success).toBe(true);
  });
});
