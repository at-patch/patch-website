import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PATCH-${stamp}-${rand}`;
}
