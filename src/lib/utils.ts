import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "BDT") {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function isValidImageSrc(src?: string): src is string {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Escapes user input before it lands in a Mongo $regex, so special characters
// match literally instead of altering the pattern.
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PATCH-${stamp}-${rand}`;
}

export function getTotalQuantity(product: Pick<Product, "rarity" | "status" | "variants">) {
  if (product.rarity !== "multi-quantity") {
    return product.status === "available" ? 1 : 0;
  }

  return (product.variants ?? []).reduce((sum, variant) => sum + Math.max(variant.quantity, 0), 0);
}
