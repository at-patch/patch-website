import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectToDatabase } from "@/lib/db";
import HomepageSettingsModel from "@/lib/models/HomepageSettings";
import ProductBatchModel from "@/lib/models/ProductBatch";
import ProductModel from "@/lib/models/Product";

function loadEnvFile(name: string) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

async function upsertBatch(title: string, description: string, productIds: unknown[]) {
  return ProductBatchModel.findOneAndUpdate(
    { title },
    {
      $set: {
        title,
        description,
        products: productIds,
        active: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  await connectToDatabase();

  const products = await ProductModel.find({ status: "available" })
    .sort({ createdAt: -1 })
    .limit(16)
    .select("_id")
    .lean();

  const bestSellingIds = products.slice(0, 8).map((product) => product._id);
  const newArrivalIds = (products.slice(8, 16).length > 0 ? products.slice(8, 16) : products.slice(0, 8)).map(
    (product) => product._id
  );

  const [bestSelling, newArrivals] = await Promise.all([
    upsertBatch("Best Selling", "Customer favorites from the latest PATCH pieces.", bestSellingIds),
    upsertBatch("New Arrivals", "Freshly added one-of-one and limited-run pieces.", newArrivalIds),
  ]);

  await HomepageSettingsModel.findOneAndUpdate(
    { key: "homepage" },
    {
      $set: {
        productBatches: [
          { batch: bestSelling._id, enabled: true, order: 0 },
          { batch: newArrivals._id, enabled: true, order: 1 },
        ],
      },
      $setOnInsert: { key: "homepage" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Backfilled homepage with ${bestSellingIds.length} best-selling products and ${newArrivalIds.length} new-arrival products.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
