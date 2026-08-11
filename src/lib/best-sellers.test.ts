import { describe, expect, it } from "vitest";
import { TOP_SELLING_LIMIT, buildTopSellingPipeline, mapTopSellingRows } from "./best-sellers";

type Stage = Record<string, unknown>;

function stage(pipeline: Stage[], key: string) {
  return pipeline.find((entry) => key in entry)?.[key] as Record<string, unknown>;
}

describe("buildTopSellingPipeline", () => {
  it("counts only paid, non-cancelled orders", () => {
    const match = stage(buildTopSellingPipeline() as Stage[], "$match");

    expect(match).toEqual({ paymentStatus: "paid", status: { $ne: "cancelled" } });
  });

  it("ranks by units, then revenue, then most recent sale", () => {
    const sort = stage(buildTopSellingPipeline() as Stage[], "$sort");

    expect(Object.entries(sort)).toEqual([
      ["units", -1],
      ["revenue", -1],
      ["lastSoldAt", -1],
    ]);
  });

  it("aggregates revenue from canonical BDT prices so currencies never mix", () => {
    const group = stage(buildTopSellingPipeline() as Stage[], "$group");

    expect(group.revenue).toEqual({ $sum: { $ifNull: ["$items.basePrice", "$items.price"] } });
    expect(group.units).toEqual({ $sum: 1 });
    expect(group._id).toBe("$items.product");
  });

  it("defaults to ten rows and honours an explicit limit", () => {
    expect(stage(buildTopSellingPipeline() as Stage[], "$limit")).toBe(TOP_SELLING_LIMIT);
    expect(TOP_SELLING_LIMIT).toBe(10);
    expect(stage(buildTopSellingPipeline(3) as Stage[], "$limit")).toBe(3);
  });
});

describe("mapTopSellingRows", () => {
  it("serialises ids and dates for the admin view", () => {
    const [row] = mapTopSellingRows([
      {
        _id: { toString: () => "64f100000000000000000001" },
        name: "Patchwork Jacket",
        sku: "PW-001",
        image: "https://example.com/a.jpg",
        units: 4,
        revenue: 12000,
        lastSoldAt: new Date("2026-08-01T10:00:00.000Z"),
      },
    ]);

    expect(row).toEqual({
      productId: "64f100000000000000000001",
      name: "Patchwork Jacket",
      sku: "PW-001",
      image: "https://example.com/a.jpg",
      units: 4,
      revenue: 12000,
      lastSoldAt: "2026-08-01T10:00:00.000Z",
    });
  });

  it("keeps historical rows readable when a product no longer resolves", () => {
    const [row] = mapTopSellingRows([{ _id: null, units: 2 }]);

    expect(row).toMatchObject({
      productId: "",
      name: "Unknown product",
      sku: "",
      image: "",
      units: 2,
      revenue: 0,
      lastSoldAt: null,
    });
  });
});
