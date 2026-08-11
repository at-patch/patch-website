// Curated Shop sections only headline the bare catalog view. Any explicit browsing
// intent — search, filter, sort, or paging — hands the page back to the full catalog.
export const BROWSE_INTENT_KEYS = ["category", "size", "minPrice", "maxPrice", "search", "sort"] as const;

export function isDefaultShopView(params: Record<string, string | undefined>) {
  if (BROWSE_INTENT_KEYS.some((key) => params[key])) return false;
  return !params.page || params.page === "1";
}
