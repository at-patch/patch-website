import { describe, expect, it } from "vitest";
import {
  countMissingTags,
  filterTagOptions,
  inventoryToTagOption,
  productToTagOption,
  resolveTagOptions,
  toggleTag,
  type TagOption,
} from "./tag-options";

const OPTIONS: TagOption[] = [
  { id: "a1", label: "Sunset Panel Jacket", hint: "PATCH-JKT-001" },
  { id: "b2", label: "Garden Wrap Dress", hint: "PATCH-DRS-002" },
  { id: "c3", label: "Ink Barrel-Leg Pants", hint: "PATCH-PNT-003" },
];

describe("filterTagOptions", () => {
  it("returns everything for an empty or whitespace query", () => {
    expect(filterTagOptions(OPTIONS, "")).toHaveLength(3);
    expect(filterTagOptions(OPTIONS, "   ")).toHaveLength(3);
  });

  it("matches on label, case-insensitively", () => {
    expect(filterTagOptions(OPTIONS, "jacket").map((o) => o.id)).toEqual(["a1"]);
    expect(filterTagOptions(OPTIONS, "GARDEN").map((o) => o.id)).toEqual(["b2"]);
  });

  it("matches on hint", () => {
    expect(filterTagOptions(OPTIONS, "pnt-003").map((o) => o.id)).toEqual(["c3"]);
  });

  it("tolerates options with no hint", () => {
    expect(filterTagOptions([{ id: "x", label: "Plain" }], "plain")).toHaveLength(1);
    expect(filterTagOptions([{ id: "x", label: "Plain" }], "nope")).toHaveLength(0);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterTagOptions(OPTIONS, "zzz")).toEqual([]);
  });
});

describe("resolveTagOptions", () => {
  it("resolves ids in the order they were saved, not catalog order", () => {
    expect(resolveTagOptions(["c3", "a1"], OPTIONS).map((o) => o.label)).toEqual([
      "Ink Barrel-Leg Pants",
      "Sunset Panel Jacket",
    ]);
  });

  it("drops ids whose record no longer exists", () => {
    expect(resolveTagOptions(["a1", "deleted", "b2"], OPTIONS).map((o) => o.id)).toEqual(["a1", "b2"]);
  });

  it("handles the untagged case", () => {
    expect(resolveTagOptions([], OPTIONS)).toEqual([]);
  });
});

describe("toggleTag", () => {
  it("adds an id that is not selected", () => {
    expect(toggleTag([], "a1")).toEqual(["a1"]);
    expect(toggleTag(["a1"], "b2")).toEqual(["a1", "b2"]);
  });

  it("removes an id that is already selected", () => {
    expect(toggleTag(["a1", "b2"], "a1")).toEqual(["b2"]);
  });

  it("never mutates the input", () => {
    const ids = ["a1"];
    toggleTag(ids, "b2");
    expect(ids).toEqual(["a1"]);
  });
});

describe("countMissingTags", () => {
  it("counts tags pointing at deleted records", () => {
    expect(countMissingTags(["a1", "gone", "alsoGone"], OPTIONS)).toBe(2);
    expect(countMissingTags(["a1"], OPTIONS)).toBe(0);
    expect(countMissingTags([], OPTIONS)).toBe(0);
  });
});

describe("adapters", () => {
  it("shows a product by name with its SKU as the hint", () => {
    expect(productToTagOption({ _id: "p1", name: "Sunset Panel Jacket", sku: "PATCH-JKT-001" })).toEqual({
      id: "p1",
      label: "Sunset Panel Jacket",
      hint: "PATCH-JKT-001",
    });
  });

  it("shows an inventory item by item code, qualified by fabric and category", () => {
    expect(
      inventoryToTagOption({ _id: "i1", itemCode: "INV-1195", fabricCode: "oo1", category: "danum" })
    ).toEqual({ id: "i1", label: "INV-1195", hint: "oo1 · danum" });
  });

  it("omits an absent category from the inventory hint", () => {
    expect(inventoryToTagOption({ _id: "i2", itemCode: "INV-2", fabricCode: "F-2" }).hint).toBe("F-2");
  });
});
