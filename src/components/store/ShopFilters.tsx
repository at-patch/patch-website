"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];

export function ShopFilters({
  categories,
  sizes,
  maxPrice,
}: {
  categories: Category[];
  sizes: string[];
  maxPrice: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const sort = searchParams.get("sort") ?? "newest";
  const minPrice = searchParams.get("minPrice") ?? "0";
  const maxPriceParam = searchParams.get("maxPrice") ?? String(maxPrice);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const content = (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-patch-ink">Category</p>
        <div className="mt-3 space-y-2">
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2 text-sm text-patch-ink-muted">
              <input
                type="checkbox"
                checked={activeCategory === cat.slug}
                onChange={() => updateParams({ category: activeCategory === cat.slug ? null : cat.slug })}
                className="accent-patch-accent"
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-patch-ink">Size</p>
          <div className="mt-3 space-y-2">
            {sizes.map((size) => (
              <label key={size} className="flex items-center gap-2 text-sm text-patch-ink-muted">
                <input
                  type="checkbox"
                  checked={activeSize === size}
                  onChange={() => updateParams({ size: activeSize === size ? null : size })}
                  className="accent-patch-accent"
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-patch-ink">Price Range</p>
        <div className="relative mt-4 h-1 rounded-full bg-patch-line">
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={minPrice}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-patch-ink"
          />
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={maxPriceParam}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-patch-accent"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-patch-ink-muted">
          <span>{minPrice} BDT</span>
          <span>{maxPriceParam} BDT</span>
        </div>
      </div>

      {(activeCategory || activeSize || searchParams.get("minPrice") || searchParams.get("maxPrice")) && (
        <button
          onClick={() => router.push("/shop")}
          className="text-xs font-medium text-patch-ink underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden sm:block sm:w-56 sm:shrink-0">{content}</div>

      <div className="flex items-center justify-between gap-4 sm:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-full border border-patch-line px-4 py-2 text-sm"
        >
          <SlidersHorizontal size={14} /> Filter
        </button>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="rounded-full border border-patch-line bg-transparent px-4 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-patch-bg">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-patch-bg p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-medium">Filters</p>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X size={18} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export function ShopSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "newest";

  return (
    <select
      value={sort}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", e.target.value);
        params.delete("page");
        router.push(`/shop?${params.toString()}`, { scroll: false });
      }}
      className="hidden rounded-full border border-patch-line bg-transparent px-4 py-2 text-sm sm:block"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-patch-bg">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
