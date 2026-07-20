import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import HomepageSettingsModel from "@/lib/models/HomepageSettings";
import ProductBatchModel from "@/lib/models/ProductBatch";
import ProductModel from "@/lib/models/Product";
import { hydrateProductsWithSampleImages } from "@/lib/sample-catalog";
import type { Product } from "@/types";

export type HomepageProductSection = {
  id: string;
  title: string;
  description?: string;
  products: Product[];
};

type LeanProductBatch = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  active: boolean;
  products: Product[];
};

type LeanHomepageSettings = {
  productBatches?: Array<{
    batch?: LeanProductBatch | Types.ObjectId | string | null;
    enabled?: boolean;
    order?: number;
  }>;
};

type LeanHomepageBatchValue = NonNullable<LeanHomepageSettings["productBatches"]>[number]["batch"];

function isPopulatedBatch(batch: LeanHomepageBatchValue): batch is LeanProductBatch {
  return Boolean(batch && typeof batch === "object" && "active" in batch && "products" in batch);
}

export async function getHomepageProductSections(): Promise<HomepageProductSection[]> {
  await connectToDatabase();

  const settings = await HomepageSettingsModel.findOne({ key: "homepage" })
    .populate({
      path: "productBatches.batch",
      model: ProductBatchModel,
      match: { active: true },
      populate: {
        path: "products",
        model: ProductModel,
        match: { status: "available" },
      },
    })
    .lean<LeanHomepageSettings | null>();

  if (!settings?.productBatches?.length) return [];

  return settings.productBatches
    .filter((row) => row.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((row) => {
      if (!isPopulatedBatch(row.batch)) return [];

      const products = hydrateProductsWithSampleImages(
        JSON.parse(JSON.stringify(row.batch.products ?? [])) as Product[]
      );
      if (products.length === 0) return [];

      return [
        {
          id: row.batch._id.toString(),
          title: row.batch.title,
          description: row.batch.description || undefined,
          products,
        },
      ];
    });
}
