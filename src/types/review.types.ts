import type { Product } from "./product.types";

export interface Review {
  _id: string;
  customerName: string;
  rating: number;
  reviewText: string;
  photo: string;
  productRef?: string | Pick<Product, "_id" | "name" | "slug" | "price" | "currency" | "images">;
  verifiedBuyer: boolean;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewInput {
  customerName: string;
  rating: number;
  reviewText: string;
  photo?: string;
  productRef?: string;
  verifiedBuyer?: boolean;
  featured?: boolean;
  order?: number;
}
