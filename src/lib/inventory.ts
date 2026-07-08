import ProductModel from "@/lib/models/Product";

type StockItem = {
  product: unknown;
  size: string;
  color?: string | null;
};

async function getRarity(productId: unknown) {
  const product = await ProductModel.findById(productId).select("rarity").lean();
  return product?.rarity === "multi-quantity" ? "multi-quantity" : "one-of-one";
}

export async function claimStockForItem(item: StockItem) {
  const rarity = await getRarity(item.product);
  const normalizedColor = item.color?.trim() ?? "";

  if (rarity === "multi-quantity") {
    const claimed = await ProductModel.findOneAndUpdate(
      {
        _id: item.product,
        variants: { $elemMatch: { size: item.size, color: normalizedColor, quantity: { $gte: 1 } } },
      },
      { $inc: { "variants.$.quantity": -1 } },
      { new: true }
    )
      .select("_id")
      .lean();

    return Boolean(claimed);
  }

  const claimed = await ProductModel.findOneAndUpdate(
    { _id: item.product, status: "available" },
    { $set: { status: "reserved" } },
    { new: true }
  )
    .select("_id")
    .lean();

  return Boolean(claimed);
}

export async function releaseStockForItem(item: StockItem) {
  const rarity = await getRarity(item.product);
  const normalizedColor = item.color?.trim() ?? "";

  if (rarity === "multi-quantity") {
    await ProductModel.updateOne(
      { _id: item.product, variants: { $elemMatch: { size: item.size, color: normalizedColor } } },
      { $inc: { "variants.$.quantity": 1 } }
    );
    return;
  }

  await ProductModel.updateOne({ _id: item.product }, { $set: { status: "available" } });
}

export async function releaseOrderStock(order: { items: StockItem[] }) {
  await Promise.all(order.items.map((item) => releaseStockForItem(item)));
}
