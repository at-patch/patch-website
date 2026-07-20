export const SIZES = ["Baby", "XS", "S", "M", "L", "XL", "XXL"] as const;

export type Size = (typeof SIZES)[number];

// Canonical site URL — used for metadata, sitemaps, and absolute share links.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patch.example.com";
