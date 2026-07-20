import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductModel from "./models/Product";
import { claimStockForItem, releaseOrderStock, releaseStockForItem } from "./inventory";

vi.mock("./models/Product", () => ({
  default: {
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

// getRarity() calls ProductModel.findById(id).select("rarity").lean()
function mockRarity(rarity: "one-of-one" | "multi-quantity") {
  vi.mocked(ProductModel.findById).mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ rarity }) }),
  } as never);
}

// claimStockForItem() calls ProductModel.findOneAndUpdate(...).select("_id").lean()
function mockClaimResult(doc: Record<string, unknown> | null) {
  vi.mocked(ProductModel.findOneAndUpdate).mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(doc) }),
  } as never);
}

describe("claimStockForItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductModel.updateOne).mockResolvedValue({} as never);
  });

  describe("one-of-one", () => {
    it("reserves an available piece and reports success", async () => {
      mockRarity("one-of-one");
      mockClaimResult({ _id: "p1" });

      const claimed = await claimStockForItem({ product: "p1", size: "M", color: "Black" });

      expect(claimed).toBe(true);
      expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "p1", status: "available" },
        { $set: { status: "reserved" } },
        { new: true }
      );
    });

    it("rejects when the piece is already reserved or sold", async () => {
      mockRarity("one-of-one");
      mockClaimResult(null);

      expect(await claimStockForItem({ product: "p1", size: "M", color: "Black" })).toBe(false);
    });
  });

  describe("multi-quantity", () => {
    it("decrements the matching in-stock variant and reports success", async () => {
      mockRarity("multi-quantity");
      mockClaimResult({ _id: "p1" });

      const claimed = await claimStockForItem({ product: "p1", size: "M", color: "  Black " });

      expect(claimed).toBe(true);
      // color is trimmed, and the variant must still have quantity >= 1
      expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "p1", variants: { $elemMatch: { size: "M", color: "Black", quantity: { $gte: 1 } } } },
        { $inc: { "variants.$.quantity": -1 } },
        { new: true }
      );
    });

    it("normalizes a missing color to an empty string when matching a variant", async () => {
      mockRarity("multi-quantity");
      mockClaimResult({ _id: "p1" });

      await claimStockForItem({ product: "p1", size: "L", color: null });

      expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "p1", variants: { $elemMatch: { size: "L", color: "", quantity: { $gte: 1 } } } },
        { $inc: { "variants.$.quantity": -1 } },
        { new: true }
      );
    });

    it("rejects when no matching variant has stock left", async () => {
      mockRarity("multi-quantity");
      mockClaimResult(null);

      expect(await claimStockForItem({ product: "p1", size: "M", color: "Black" })).toBe(false);
    });
  });
});

describe("releaseStockForItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductModel.updateOne).mockResolvedValue({} as never);
  });

  it("returns a one-of-one piece to available", async () => {
    mockRarity("one-of-one");

    await releaseStockForItem({ product: "p1", size: "M", color: "Black" });

    expect(ProductModel.updateOne).toHaveBeenCalledWith(
      { _id: "p1" },
      { $set: { status: "available" } }
    );
  });

  it("restores the exact multi-quantity variant it decremented", async () => {
    mockRarity("multi-quantity");

    await releaseStockForItem({ product: "p1", size: "M", color: "  Black " });

    expect(ProductModel.updateOne).toHaveBeenCalledWith(
      { _id: "p1", variants: { $elemMatch: { size: "M", color: "Black" } } },
      { $inc: { "variants.$.quantity": 1 } }
    );
  });
});

describe("releaseOrderStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductModel.updateOne).mockResolvedValue({} as never);
  });

  it("releases every line of a mixed-rarity order", async () => {
    // one-of-one for the first item, multi-quantity for the second
    vi.mocked(ProductModel.findById)
      .mockReturnValueOnce({
        select: () => ({ lean: () => Promise.resolve({ rarity: "one-of-one" }) }),
      } as never)
      .mockReturnValueOnce({
        select: () => ({ lean: () => Promise.resolve({ rarity: "multi-quantity" }) }),
      } as never);

    await releaseOrderStock({
      items: [
        { product: "p1", size: "M", color: "Black" },
        { product: "p2", size: "L", color: "Blue" },
      ],
    });

    expect(ProductModel.updateOne).toHaveBeenCalledTimes(2);
    expect(ProductModel.updateOne).toHaveBeenCalledWith(
      { _id: "p1" },
      { $set: { status: "available" } }
    );
    expect(ProductModel.updateOne).toHaveBeenCalledWith(
      { _id: "p2", variants: { $elemMatch: { size: "L", color: "Blue" } } },
      { $inc: { "variants.$.quantity": 1 } }
    );
  });
});
