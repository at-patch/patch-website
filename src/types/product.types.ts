export type ProductCategory = string;

export type ProductStatus = "available" | "reserved" | "sold" | "archived";

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
  isOneOfOne: boolean;
  batchLabel: string;
  quantityAvailable: number;
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
  isOneOfOne?: boolean;
  batchLabel?: string;
  quantityAvailable?: number;
  sourceInventoryItem?: string;
}
