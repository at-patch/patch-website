import { describe, expect, it } from "vitest";
import {
  inventoryItemCreateSchema,
  patternCreateSchema,
  shippingCityCreateSchema,
} from "./admin-material.schemas";

describe("inventoryItemCreateSchema", () => {
  it("accepts the client spreadsheet inventory shape", () => {
    const result = inventoryItemCreateSchema.safeParse({
      image: "https://example.com/inventory.jpg",
      fabricCode: "Fab-001",
      category: "Cut Piece",
      heightInches: 22,
      widthInches: 19,
      quantityPcs: 8,
      description: "Factory offcut",
    });
    expect(result.success).toBe(true);
  });

  it("requires an image and non-negative quantity", () => {
    const result = inventoryItemCreateSchema.safeParse({
      image: "",
      fabricCode: "Fab-001",
      category: "Cut Piece",
      heightInches: 22,
      widthInches: 19,
      quantityPcs: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("patternCreateSchema", () => {
  it("accepts numeric sizes and string fabric amounts", () => {
    const result = patternCreateSchema.safeParse({
      patternImage: "https://example.com/pattern.jpg",
      fabricCode: "Fab-066",
      sampleCode: "SMP-001",
      fabAmount1: "1.75 Yards",
      fabricAmount2: "45*60",
      size1: 1,
      size2: 0.75,
    });
    expect(result.success).toBe(true);
  });
});

describe("shippingCityCreateSchema", () => {
  it("accepts an editable city shipping cost", () => {
    const result = shippingCityCreateSchema.safeParse({
      name: "Dhaka",
      division: "Dhaka",
      shippingCost: 80,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative shipping cost", () => {
    expect(shippingCityCreateSchema.safeParse({ name: "Dhaka", shippingCost: -1 }).success).toBe(false);
  });
});
