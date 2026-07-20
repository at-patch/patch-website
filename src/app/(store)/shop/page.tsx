import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import CategoryModel from "@/lib/models/Category";
import { ProductCard } from "@/components/store/ProductCard";
import { ShopFilters, ShopSort } from "@/components/store/ShopFilters";
import {
  SAMPLE_SIZES,
  filterSampleProducts,
  hydrateProductsWithSampleImages,
  mergeCategoriesWithSamples,
  sortProducts,
  topUpProducts,
} from "@/lib/sample-catalog";
import type { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse one-of-one and limited-batch pieces upcycled from waste textiles — new styles land often.",
};

const PAGE_SIZE = 12;

async function getShopData(searchParams: Record<string, string | undefined>) {
  let allAvailable: Product[] = [];
  let categories: Category[] = [];

  try {
    await connectToDatabase();
    const [dbProducts, dbCategories] = await Promise.all([
      ProductModel.find({ status: "available" }).sort({ createdAt: -1 }).lean(),
      CategoryModel.find({}).sort({ order: 1 }).lean(),
    ]);
    allAvailable = hydrateProductsWithSampleImages(JSON.parse(JSON.stringify(dbProducts)) as Product[]);
    categories = JSON.parse(JSON.stringify(dbCategories)) as Category[];
  } catch {
    allAvailable = [];
    categories = [];
  }

  const catalog = hydrateProductsWithSampleImages(topUpProducts(allAvailable, 12));
  const filtered = sortProducts(filterSampleProducts(catalog, searchParams), searchParams.sort ?? "newest");
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const pagedProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sizes = Array.from(
    new Set(
      catalog.flatMap((product) => [
        ...(product.rarity === "multi-quantity" ? [] : product.size ? [product.size] : []),
        ...product.variants.filter((variant) => variant.quantity > 0).map((variant) => variant.size),
      ])
    )
  ).sort((a, b) => SAMPLE_SIZES.indexOf(a as (typeof SAMPLE_SIZES)[number]) - SAMPLE_SIZES.indexOf(b as (typeof SAMPLE_SIZES)[number]));
  const maxPrice = catalog.reduce((max, product) => Math.max(max, product.price), 5000);

  return {
    products: pagedProducts,
    total: filtered.length,
    page,
    totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    sizes,
    maxPrice,
    categories: mergeCategoriesWithSamples(categories),
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { products, total, page, totalPages, sizes, maxPrice, categories } = await getShopData(params);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-accent">Shop</p>
        <h1 className="font-heading mt-2 text-4xl font-extrabold tracking-tight text-patch-ink">
          New In
        </h1>
        <p className="mt-2 max-w-lg text-sm text-patch-ink-muted">
          Fresh styles land often and move fast — don&apos;t sleep on your size.
        </p>
      </div>

      <div className="flex flex-col gap-10 sm:flex-row">
        <ShopFilters categories={categories} sizes={sizes} maxPrice={maxPrice} />

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-patch-ink-muted">{total} pieces</p>
            <ShopSort />
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-patch-ink-muted">
              No pieces match those filters right now. Try widening your search.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const params2 = new URLSearchParams(
                  Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
                );
                params2.set("page", String(p));
                return (
                  <a
                    key={p}
                    href={`/shop?${params2.toString()}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      p === page ? "bg-patch-ink text-patch-bg" : "text-patch-ink-muted hover:bg-patch-bg-alt"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
