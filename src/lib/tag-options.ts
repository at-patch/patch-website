// Shared rules for the optional tag pickers in the admin material screens:
// inventory items tagged with the products made from them, and patterns tagged
// with both the products they produce and the materials they consume.
//
// Pure and DB-free so search and selection can be unit-tested without a browser.

/** One selectable row: `hint` is the secondary text (a SKU, a fabric code). */
export type TagOption = {
  id: string;
  label: string;
  hint?: string;
};

/** Case-insensitive match on label or hint. An empty query matches everything. */
export function filterTagOptions(options: TagOption[], query: string): TagOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      (option.hint ?? "").toLowerCase().includes(needle)
  );
}

/**
 * Turns stored ids into options for display, in the order the ids were saved.
 * Ids with no matching option are dropped rather than rendered as raw ObjectIds —
 * a tagged record can be deleted, and tags pointing at it are not cleaned up.
 */
export function resolveTagOptions(ids: string[], options: TagOption[]): TagOption[] {
  const byId = new Map(options.map((option) => [option.id, option]));
  return ids.map((id) => byId.get(id)).filter((option): option is TagOption => Boolean(option));
}

/** Adds the id when absent, removes it when present. Tagging is optional, so empty is valid. */
export function toggleTag(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/** How many stored tags point at records that no longer exist. */
export function countMissingTags(ids: string[], options: TagOption[]): number {
  return ids.length - resolveTagOptions(ids, options).length;
}

export function productToTagOption(product: { _id: string; name: string; sku: string }): TagOption {
  return { id: product._id, label: product.name, hint: product.sku };
}

export function inventoryToTagOption(item: {
  _id: string;
  itemCode: string;
  fabricCode: string;
  category?: string;
}): TagOption {
  // The fabric code is what the team actually recognises a roll by; the item code
  // is the stable identifier, so it leads and the fabric/category qualifies it.
  const hint = [item.fabricCode, item.category].filter(Boolean).join(" · ");
  return { id: item._id, label: item.itemCode, hint };
}
