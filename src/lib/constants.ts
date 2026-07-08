export const SIZES = ["Baby", "XS", "S", "M", "L", "XL", "XXL"] as const;

export type Size = (typeof SIZES)[number];
