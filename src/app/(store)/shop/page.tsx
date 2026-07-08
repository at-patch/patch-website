import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import CategoryModel from "@/lib/models/Category";
import { ProductCard } from "@/components/store/ProductCard";
import { ShopFilters, ShopSort } from "@/components/store/ShopFilters";
import type { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  popularity: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
};

async function getShopData(searchParams: Record<string, string | undefined>) {
  await connectToDatabase();

  const filter: Record<string, unknown> = { status: "available" };
  if (searchParams.category) filter.category = searchParams.category;
  if (searchParams.size) filter.size = searchParams.size;
  if (searchParams.search) filter.name = { $regex: searchParams.search, $options: "i" };
  if (searchParams.minPrice || searchParams.maxPrice) {
    filter.price = {
      ...(searchParams.minPrice ? { $gte: Number(searchParams.minPrice) } : {}),
      ...(searchParams.maxPrice ? { $lte: Number(searchParams.maxPrice) } : {}),
    };
  }

  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const sort = SORT_MAP[searchParams.sort ?? "newest"] ?? SORT_MAP.newest;

  const [products, total, allAvailable, categories] = await Promise.all([
    ProductModel.find(filter)
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    ProductModel.countDocuments(filter),
    ProductModel.find({ status: "available" }).select("size price").lean(),
    CategoryModel.find({}).sort({ order: 1 }).lean(),
  ]);

  const sizes = Array.from(new Set(allAvailable.map((p) => p.size).filter(Boolean))).sort();
  const maxPrice = allAvailable.reduce((max, p) => Math.max(max, p.price), 5000);

  return {
    products: JSON.parse(JSON.stringify(products)) as Product[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sizes,
    maxPrice,
    categories: JSON.parse(JSON.stringify(categories)) as Category[],
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
