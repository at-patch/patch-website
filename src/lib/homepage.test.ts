import { describe, expect, it, vi } from "vitest";

async function loadHomepage(settings: unknown) {
  vi.resetModules();

  const lean = vi.fn().mockResolvedValue(settings);
  const populate = vi.fn().mockReturnValue({ lean });
  const findOne = vi.fn().mockReturnValue({ populate });

  vi.doMock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock("@/lib/models/ProductBatch", () => ({ default: {} }));
  vi.doMock("@/lib/models/Product", () => ({ default: {} }));
  vi.doMock("@/lib/models/HomepageSettings", () => ({
    default: {
      findOne,
    },
  }));
  vi.doMock("@/lib/sample-catalog", () => ({
    hydrateProductsWithSampleImages: vi.fn((products) => products),
  }));

  return import("./homepage");
}

describe("getHomepageProductSections", () => {
  it("skips disabled, missing, and empty batches", async () => {
    const { getHomepageProductSections } = await loadHomepage({
      productBatches: [
        {
          enabled: true,
          order: 2,
          batch: { _id: { toString: () => "empty" }, title: "Empty", active: true, products: [] },
        },
        {
          enabled: false,
          order: 0,
          batch: { _id: { toString: () => "disabled" }, title: "Disabled", active: true, products: [{ _id: "p2" }] },
        },
        {
          enabled: true,
          order: 1,
          batch: null,
        },
        {
          enabled: true,
          order: 3,
          batch: { _id: { toString: () => "live" }, title: "Live", description: "Picked by admin", active: true, products: [{ _id: "p1" }] },
        },
      ],
    });

    await expect(getHomepageProductSections()).resolves.toEqual([
      {
        id: "live",
        title: "Live",
        description: "Picked by admin",
        products: [{ _id: "p1" }],
      },
    ]);
  });
});
