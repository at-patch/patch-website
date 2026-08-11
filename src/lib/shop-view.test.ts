import { describe, expect, it } from "vitest";
import { isDefaultShopView } from "./shop-view";

describe("isDefaultShopView", () => {
  it("shows curated sections on the bare shop view", () => {
    expect(isDefaultShopView({})).toBe(true);
    expect(isDefaultShopView({ page: "1" })).toBe(true);
  });

  it.each(["category", "size", "minPrice", "maxPrice", "search", "sort"])(
    "hides curated sections once %s is applied",
    (key) => {
      expect(isDefaultShopView({ [key]: "anything" })).toBe(false);
    }
  );

  it("hides curated sections beyond the first page", () => {
    expect(isDefaultShopView({ page: "2" })).toBe(false);
  });

  it("ignores empty filter values left in the URL", () => {
    expect(isDefaultShopView({ category: "", sort: "", page: "" })).toBe(true);
  });
});
