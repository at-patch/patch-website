import { SIZES } from "@/lib/constants";
import { isValidImageSrc } from "@/lib/utils";
import type { Category, Product } from "@/types";

const now = "2026-07-08T00:00:00.000Z";

function makeImageSet(primary: string, secondary?: string) {
  return secondary ? [primary, secondary] : [primary, primary];
}

export const SAMPLE_CATEGORIES: Category[] = [
  {
    _id: "cat-outerwear",
    name: "Outerwear",
    slug: "outerwear",
    image: "/catalog/categories/outerwear.svg",
    order: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "cat-tops",
    name: "Tops",
    slug: "tops",
    image: "/catalog/categories/tops.svg",
    order: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "cat-bottoms",
    name: "Bottoms",
    slug: "bottoms",
    image: "/catalog/categories/bottoms.svg",
    order: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "cat-dresses",
    name: "Dresses",
    slug: "dresses",
    image: "/catalog/categories/dresses.svg",
    order: 4,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    image: "/catalog/categories/accessories.svg",
    order: 5,
    createdAt: now,
    updatedAt: now,
  },
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    _id: "64f100000000000000000001",
    sku: "PATCH-001",
    name: "Sunset Panel Jacket",
    slug: "sunset-panel-jacket",
    description: "A cropped patchwork jacket with warm sunset tones and an easy everyday shape.",
    story: "Built from rescued suiting and cotton remnants, then finished with contrast topstitching.",
    images: makeImageSet("/catalog/products/sunset-panel-jacket.svg"),
    price: 4200,
    currency: "BDT",
    category: "outerwear",
    materials: ["Cotton", "Suiting"],
    size: "M",
    rarity: "one-of-one",
    variants: [],
    batchLabel: "1-of-1",
    status: "available",
    createdAt: "2026-07-08T00:00:01.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000002",
    sku: "PATCH-002",
    name: "Studio Utility Overshirt",
    slug: "studio-utility-overshirt",
    description: "Relaxed overshirt with large pockets, light structure, and a washed workwear finish.",
    story: "Designed for layering through monsoon evenings and long studio days.",
    images: makeImageSet("/catalog/products/studio-utility-overshirt.svg"),
    price: 3600,
    currency: "BDT",
    category: "outerwear",
    materials: ["Twill", "Cotton"],
    size: "L",
    rarity: "multi-quantity",
    variants: [
      { size: "M", color: "Olive", quantity: 2 },
      { size: "L", color: "Olive", quantity: 3 },
      { size: "XL", color: "Olive", quantity: 1 },
    ],
    batchLabel: "Limited Run",
    status: "available",
    createdAt: "2026-07-08T00:00:02.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000003",
    sku: "PATCH-003",
    name: "Indigo Thread Crop Shirt",
    slug: "indigo-thread-crop-shirt",
    description: "Cropped button-up with visible seaming and an indigo wash that softens over time.",
    story: "Cut from leftover shirting panels and rebalanced with a shorter hem.",
    images: makeImageSet("/catalog/products/indigo-thread-crop-shirt.svg"),
    price: 2400,
    currency: "BDT",
    category: "tops",
    materials: ["Cotton Poplin"],
    size: "S",
    rarity: "multi-quantity",
    variants: [
      { size: "S", color: "Indigo", quantity: 2 },
      { size: "M", color: "Indigo", quantity: 2 },
      { size: "L", color: "Indigo", quantity: 1 },
    ],
    batchLabel: "New Drop",
    status: "available",
    createdAt: "2026-07-08T00:00:03.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000004",
    sku: "PATCH-004",
    name: "Terracotta Boxy Tee",
    slug: "terracotta-boxy-tee",
    description: "Soft jersey tee with a roomy boxy fit and warm terracotta tone.",
    story: "An easy styling base built to pair with louder patchwork pieces.",
    images: makeImageSet("/catalog/products/terracotta-boxy-tee.svg"),
    price: 1550,
    currency: "BDT",
    category: "tops",
    materials: ["Cotton Jersey"],
    size: "M",
    rarity: "multi-quantity",
    variants: [
      { size: "S", color: "Terracotta", quantity: 3 },
      { size: "M", color: "Terracotta", quantity: 4 },
      { size: "L", color: "Terracotta", quantity: 2 },
    ],
    batchLabel: "Restocked",
    status: "available",
    createdAt: "2026-07-08T00:00:04.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000005",
    sku: "PATCH-005",
    name: "Ash Wide-Leg Trousers",
    slug: "ash-wide-leg-trousers",
    description: "High-rise trousers with a clean drape, roomy leg, and a slightly structured hand feel.",
    story: "Tailored from deadstock suiting to make everyday dressing feel sharper.",
    images: makeImageSet("/catalog/products/ash-wide-leg-trousers.svg"),
    price: 3200,
    currency: "BDT",
    category: "bottoms",
    materials: ["Deadstock Suiting"],
    size: "M",
    rarity: "multi-quantity",
    variants: [
      { size: "S", color: "Ash", quantity: 1 },
      { size: "M", color: "Ash", quantity: 2 },
      { size: "L", color: "Ash", quantity: 2 },
    ],
    batchLabel: "Best Seller",
    status: "available",
    createdAt: "2026-07-08T00:00:05.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000006",
    sku: "PATCH-006",
    name: "Khaki Pleat Skort",
    slug: "khaki-pleat-skort",
    description: "A clean front-pleat skort that moves like a skirt but stays practical all day.",
    story: "Made for Dhaka heat, bike rides, and fast outfit decisions.",
    images: makeImageSet("/catalog/products/khaki-pleat-skort.svg"),
    price: 2150,
    currency: "BDT",
    category: "bottoms",
    materials: ["Cotton Drill"],
    size: "S",
    rarity: "multi-quantity",
    variants: [
      { size: "XS", color: "Khaki", quantity: 2 },
      { size: "S", color: "Khaki", quantity: 2 },
      { size: "M", color: "Khaki", quantity: 2 },
    ],
    batchLabel: "Limited Run",
    status: "available",
    createdAt: "2026-07-08T00:00:06.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000007",
    sku: "PATCH-007",
    name: "Garden Wrap Dress",
    slug: "garden-wrap-dress",
    description: "Wrap dress with a fluid skirt, adjustable waist, and soft floral print mix.",
    story: "Patch placed by hand so every angle feels considered.",
    images: makeImageSet("/catalog/products/garden-wrap-dress.svg"),
    price: 3850,
    currency: "BDT",
    category: "dresses",
    materials: ["Rayon", "Cotton"],
    size: "M",
    rarity: "one-of-one",
    variants: [],
    batchLabel: "1-of-1",
    status: "available",
    createdAt: "2026-07-08T00:00:07.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000008",
    sku: "PATCH-008",
    name: "Monsoon Slip Dress",
    slug: "monsoon-slip-dress",
    description: "Bias-cut slip dress with contrast straps and a lightweight drape.",
    story: "An easy evening piece with enough structure to style for daytime too.",
    images: makeImageSet("/catalog/products/monsoon-slip-dress.svg"),
    price: 2950,
    currency: "BDT",
    category: "dresses",
    materials: ["Satin Blend"],
    size: "M",
    rarity: "multi-quantity",
    variants: [
      { size: "S", color: "Slate", quantity: 1 },
      { size: "M", color: "Slate", quantity: 2 },
      { size: "L", color: "Slate", quantity: 1 },
    ],
    batchLabel: "New Drop",
    status: "available",
    createdAt: "2026-07-08T00:00:08.000Z",
    updatedAt: now,
  },
  {
    _id: "64f100000000000000000009",
    sku: "PATCH-009",
    name: "Canvas Tote With Contrast Panels",
    slug: "canvas-tote-with-contrast-panels",
    description: "Roomy everyday tote with contrast patch pockets and sturdy shoulder straps.",
    story: "A practical carryall built from heavyweight leftover canvas.",
    images: makeImageSet("/catalog/products/canvas-tote-with-contrast-panels.svg"),
    price: 1450,
    currency: "BDT",
    category: "accessories",
    materials: ["Canvas"],
    size: "M",
    rarity: "multi-quantity",
    variants: [{ size: "M", color: "Natural", quantity: 6 }],
    batchLabel: "Studio Favorite",
    status: "available",
    createdAt: "2026-07-08T00:00:09.000Z",
    updatedAt: now,
  },
  {
    _id: "64f10000000000000000000a",
    sku: "PATCH-010",
    name: "Patchwork Bucket Hat",
    slug: "patchwork-bucket-hat",
    description: "Soft bucket hat pieced together from striped cotton offcuts.",
    story: "A bright add-on that uses up small fabric remnants beautifully.",
    images: makeImageSet("/catalog/products/patchwork-bucket-hat.svg"),
    price: 950,
    currency: "BDT",
    category: "accessories",
    materials: ["Cotton"],
    size: "M",
    rarity: "multi-quantity",
    variants: [{ size: "M", color: "Mixed", quantity: 5 }],
    batchLabel: "Mini Drop",
    status: "available",
    createdAt: "2026-07-08T00:00:10.000Z",
    updatedAt: now,
  },
  {
    _id: "64f10000000000000000000b",
    sku: "PATCH-011",
    name: "Rust Workwear Vest",
    slug: "rust-workwear-vest",
    description: "Sleeveless utility vest with clean lines and contrast binding.",
    story: "Made as a sharp layering piece for simple tees and oversized shirts.",
    images: makeImageSet("/catalog/products/rust-workwear-vest.svg"),
    price: 2700,
    currency: "BDT",
    category: "outerwear",
    materials: ["Canvas", "Cotton"],
    size: "L",
    rarity: "one-of-one",
    variants: [],
    batchLabel: "1-of-1",
    status: "available",
    createdAt: "2026-07-08T00:00:11.000Z",
    updatedAt: now,
  },
  {
    _id: "64f10000000000000000000c",
    sku: "PATCH-012",
    name: "Ink Barrel-Leg Pants",
    slug: "ink-barrel-leg-pants",
    description: "Barrel-leg pants with sculpted seams and a soft washed finish.",
    story: "Built to hold shape without feeling stiff, with an easy all-day fit.",
    images: makeImageSet("/catalog/products/ink-barrel-leg-pants.svg"),
    price: 3350,
    currency: "BDT",
    category: "bottoms",
    materials: ["Denim", "Cotton"],
    size: "M",
    rarity: "multi-quantity",
    variants: [
      { size: "S", color: "Ink", quantity: 1 },
      { size: "M", color: "Ink", quantity: 2 },
      { size: "L", color: "Ink", quantity: 2 },
    ],
    batchLabel: "Best Seller",
    status: "available",
    createdAt: "2026-07-08T00:00:12.000Z",
    updatedAt: now,
  },
];

export function mergeCategoriesWithSamples(categories: Category[]) {
  if (categories.length === 0) return SAMPLE_CATEGORIES;

  return categories.map((category) => {
    const sample = SAMPLE_CATEGORIES.find((item) => item.slug === category.slug);
    return sample && !category.image ? { ...category, image: sample.image } : category;
  });
}

export function topUpProducts(products: Product[], minimum = 12) {
  if (products.length >= minimum) return products;

  const existingSlugs = new Set(products.map((product) => product.slug));
  const fillers = SAMPLE_PRODUCTS.filter((product) => !existingSlugs.has(product.slug)).slice(0, minimum - products.length);
  return [...products, ...fillers];
}

export function hydrateProductsWithSampleImages(products: Product[]) {
  return products.map((product) => {
    const validImages = (product.images ?? []).filter(isValidImageSrc);
    if (validImages.length > 0) return { ...product, images: validImages };

    const sampleBySlug = SAMPLE_PRODUCTS.find((item) => item.slug === product.slug);
    if (sampleBySlug) {
      return { ...product, images: sampleBySlug.images };
    }

    const sampleByCategory = SAMPLE_PRODUCTS.find((item) => item.category === product.category);
    return sampleByCategory ? { ...product, images: sampleByCategory.images } : product;
  });
}

export function getSampleProductBySlug(slug: string) {
  return SAMPLE_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function getSampleRelatedProducts(category: string, excludeId: string) {
  return SAMPLE_PRODUCTS.filter((product) => product.category === category && product._id !== excludeId).slice(0, 8);
}

export function filterSampleProducts(
  products: Product[],
  filters: Record<string, string | undefined>
) {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.size) {
      const matchesSize =
        product.rarity === "multi-quantity"
          ? product.variants.some((variant) => variant.size === filters.size && variant.quantity > 0)
          : product.size === filters.size;
      if (!matchesSize) return false;
    }

    if (filters.minPrice && product.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && product.price > Number(filters.maxPrice)) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: string) {
  const list = [...products];

  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "popularity":
    case "newest":
    default:
      return list.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
  }
}

export const SAMPLE_SIZES = SIZES;
