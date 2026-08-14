// Helpers for the optional link from a raw-material inventory item to the products
// made out of it (`InventoryItem.productTags`). Pure and DB-free so the search and
// selection rules can be unit-tested without a browser.
import type { Product } from "@/types";

export type TaggableProduct = Pick<Product, "_id" | "name" | "sku">;

/** Case-insensitive match on product name or SKU. An empty query matches everything. */
export function filterTaggableProducts<T extends TaggableProduct>(products: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return products;
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) || product.sku.toLowerCase().includes(needle)
  );
}

/**
 * Turns stored tag ids into products for display, in the order the ids were saved.
 * Ids with no matching product are dropped rather than rendered as raw ObjectIds —
 * a tagged product can be deleted, and the tag is not cleaned up when that happens.
 */
export function resolveProductTags<T extends TaggableProduct>(ids: string[], products: T[]): T[] {
  const byId = new Map(products.map((product) => [product._id, product]));
  return ids.map((id) => byId.get(id)).filter((product): product is T => Boolean(product));
}

/** Adds the id when absent, removes it when present. Tagging is optional, so empty is valid. */
export function toggleProductTag(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/** How many stored tags point at products that no longer exist. */
export function countMissingProductTags(ids: string[], products: TaggableProduct[]): number {
  return ids.length - resolveProductTags(ids, products).length;
}
