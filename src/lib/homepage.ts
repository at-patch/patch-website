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

type LeanBatchRow = {
  batch?: LeanProductBatch | Types.ObjectId | string | null;
  enabled?: boolean;
  order?: number;
};

type LeanHomepageSettings = {
  primaryPromo?: HomepagePromo;
  secondaryPromo?: HomepagePromo;
  productBatches?: LeanBatchRow[];
  shopBatches?: LeanBatchRow[];
};

export type HomepagePromo = {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export const DEFAULT_HOMEPAGE_PROMOS = {
  primaryPromo: {
    eyebrow: "New Drop",
    title: "Color-blocked, cut for confidence.",
    body: "Bold silhouettes and statement color, styled for how you actually move through your day.",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
  },
  secondaryPromo: {
    eyebrow: "Made in Dhaka",
    title: "Every stitch, done by hand.",
    body: "Small studio team, careful finishing, a little less waste along the way — fashion that's made thoughtfully.",
    ctaLabel: "See the Process",
    ctaHref: "/story",
  },
} satisfies Record<string, HomepagePromo>;

type LeanHomepageBatchValue = LeanBatchRow["batch"];

function isPopulatedBatch(batch: LeanHomepageBatchValue): batch is LeanProductBatch {
  return Boolean(batch && typeof batch === "object" && "active" in batch && "products" in batch);
}

/**
 * Batch-backed carousel sections for a given placement. `productBatches` drives the
 * editorial homepage; `shopBatches` drives the default (unfiltered) Shop view.
 */
async function getProductSections(
  placement: "productBatches" | "shopBatches"
): Promise<HomepageProductSection[]> {
  await connectToDatabase();

  const settings = await HomepageSettingsModel.findOne({ key: "homepage" })
    .populate({
      path: `${placement}.batch`,
      model: ProductBatchModel,
      match: { active: true },
      populate: {
        path: "products",
        model: ProductModel,
        match: { status: "available" },
      },
    })
    .lean<LeanHomepageSettings | null>();

  const rows = settings?.[placement];
  if (!rows?.length) return [];

  return rows
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

export function getHomepageProductSections(): Promise<HomepageProductSection[]> {
  return getProductSections("productBatches");
}

export function getShopProductSections(): Promise<HomepageProductSection[]> {
  return getProductSections("shopBatches");
}

export async function getHomepagePromos() {
  await connectToDatabase();

  const settings = await HomepageSettingsModel.findOne({ key: "homepage" })
    .select("primaryPromo secondaryPromo")
    .lean<LeanHomepageSettings | null>();

  return {
    primaryPromo: settings?.primaryPromo ?? DEFAULT_HOMEPAGE_PROMOS.primaryPromo,
    secondaryPromo: settings?.secondaryPromo ?? DEFAULT_HOMEPAGE_PROMOS.secondaryPromo,
  };
}
