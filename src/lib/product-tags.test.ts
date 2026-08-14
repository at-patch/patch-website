import { describe, expect, it } from "vitest";
import {
  countMissingProductTags,
  filterTaggableProducts,
  resolveProductTags,
  toggleProductTag,
  type TaggableProduct,
} from "./product-tags";

const PRODUCTS: TaggableProduct[] = [
  { _id: "a1", name: "Sunset Panel Jacket", sku: "PATCH-JKT-001" },
  { _id: "b2", name: "Garden Wrap Dress", sku: "PATCH-DRS-002" },
  { _id: "c3", name: "Ink Barrel-Leg Pants", sku: "PATCH-PNT-003" },
];

describe("filterTaggableProducts", () => {
  it("returns everything for an empty or whitespace query", () => {
    expect(filterTaggableProducts(PRODUCTS, "")).toHaveLength(3);
    expect(filterTaggableProducts(PRODUCTS, "   ")).toHaveLength(3);
  });

  it("matches on name, case-insensitively", () => {
    expect(filterTaggableProducts(PRODUCTS, "jacket").map((p) => p._id)).toEqual(["a1"]);
    expect(filterTaggableProducts(PRODUCTS, "GARDEN").map((p) => p._id)).toEqual(["b2"]);
  });

  it("matches on SKU", () => {
    expect(filterTaggableProducts(PRODUCTS, "pnt-003").map((p) => p._id)).toEqual(["c3"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterTaggableProducts(PRODUCTS, "zzz")).toEqual([]);
  });
});

describe("resolveProductTags", () => {
  it("resolves ids in the order they were saved, not catalog order", () => {
    expect(resolveProductTags(["c3", "a1"], PRODUCTS).map((p) => p.name)).toEqual([
      "Ink Barrel-Leg Pants",
      "Sunset Panel Jacket",
    ]);
  });

  it("drops ids whose product no longer exists", () => {
    expect(resolveProductTags(["a1", "deleted", "b2"], PRODUCTS).map((p) => p._id)).toEqual(["a1", "b2"]);
  });

  it("handles the untagged case", () => {
    expect(resolveProductTags([], PRODUCTS)).toEqual([]);
  });
});

describe("toggleProductTag", () => {
  it("adds an id that is not selected", () => {
    expect(toggleProductTag([], "a1")).toEqual(["a1"]);
    expect(toggleProductTag(["a1"], "b2")).toEqual(["a1", "b2"]);
  });

  it("removes an id that is already selected", () => {
    expect(toggleProductTag(["a1", "b2"], "a1")).toEqual(["b2"]);
  });

  it("never mutates the input", () => {
    const ids = ["a1"];
    toggleProductTag(ids, "b2");
    expect(ids).toEqual(["a1"]);
  });
});

describe("countMissingProductTags", () => {
  it("counts tags pointing at deleted products", () => {
    expect(countMissingProductTags(["a1", "gone", "alsoGone"], PRODUCTS)).toBe(2);
    expect(countMissingProductTags(["a1"], PRODUCTS)).toBe(0);
    expect(countMissingProductTags([], PRODUCTS)).toBe(0);
  });
});
