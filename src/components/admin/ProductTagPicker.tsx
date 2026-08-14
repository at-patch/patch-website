"use client";

import { useMemo, useState } from "react";
import { Check, Search, Shirt, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterTaggableProducts,
  resolveProductTags,
  toggleProductTag,
  type TaggableProduct,
} from "@/lib/product-tags";

/**
 * Optional multi-select for "which products did we make from this material".
 * Nothing here is required — an inventory item with no tags is a normal item.
 */
export function ProductTagPicker({
  products,
  value,
  onChange,
  loading,
}: {
  products: TaggableProduct[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => resolveProductTags(value, products), [value, products]);
  const matches = useMemo(() => filterTaggableProducts(products, query), [products, query]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-medium text-patch-ink-muted">
          Products made from this material
        </label>
        <span className="text-[11px] text-patch-ink-muted/70">
          Optional{value.length > 0 ? ` · ${value.length} tagged` : ""}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((product) => (
            <span
              key={product._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-patch-accent/20 bg-patch-accent/10 px-2.5 py-1 text-xs text-patch-accent"
            >
              {product.name}
              <button
                type="button"
                onClick={() => onChange(toggleProductTag(value, product._id))}
                aria-label={`Remove tag ${product.name}`}
                className="rounded-full p-0.5 transition hover:bg-patch-accent/20"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-patch-ink-muted underline underline-offset-4 hover:text-patch-ink"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="relative mt-2">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-patch-ink-muted/70" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name or SKU"
          className="w-full rounded-xl border border-patch-line bg-patch-bg py-2.5 pl-10 pr-3.5 text-sm text-patch-ink outline-none transition placeholder:text-patch-ink-muted/60 focus:border-patch-accent focus:ring-2 focus:ring-patch-accent/15"
        />
      </div>

      <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-patch-line">
        {loading ? (
          <div className="animate-pulse space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-patch-ink/5" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-xs text-patch-ink-muted">
            {products.length === 0 ? "No products to tag yet." : "No products match that search."}
          </p>
        ) : (
          <ul className="divide-y divide-patch-line">
            {matches.map((product) => {
              const isTagged = value.includes(product._id);
              return (
                <li key={product._id}>
                  <button
                    type="button"
                    onClick={() => onChange(toggleProductTag(value, product._id))}
                    aria-pressed={isTagged}
                    className={cn(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition",
                      isTagged ? "bg-patch-accent/5 text-patch-ink" : "text-patch-ink-muted hover:bg-patch-ink/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                        isTagged ? "border-patch-accent bg-patch-accent text-patch-bg" : "border-patch-line"
                      )}
                    >
                      {isTagged && <Check size={11} />}
                    </span>
                    <Shirt size={14} className="shrink-0 text-patch-ink-muted/70" />
                    <span className="min-w-0 flex-1 truncate text-patch-ink">{product.name}</span>
                    <span className="shrink-0 text-[11px] text-patch-ink-muted">{product.sku}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
