export type ProductCategory = string;

export type ProductStatus = "available" | "reserved" | "sold" | "archived";
export type ProductRarity = "one-of-one" | "multi-quantity";

export interface ProductVariant {
  size: string;
  color: string;
  quantity: number;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  images: string[];
  price: number;
  currency: string;
  category: ProductCategory;
  materials: string[];
  size: string;
  rarity?: ProductRarity;
  variants: ProductVariant[];
  batchLabel: string;
  status: ProductStatus;
  sourceInventoryItem?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  category?: ProductCategory;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductInput {
  sku: string;
  name: string;
  slug: string;
  description: string;
  story?: string;
  images?: string[];
  price: number;
  currency?: string;
  category: ProductCategory;
  materials?: string[];
  size?: string;
  rarity?: ProductRarity;
  variants?: ProductVariant[];
  batchLabel?: string;
  sourceInventoryItem?: string;
}
