"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, getCartLineKey } from "@/store/slices/cartSlice";
import type { Product } from "@/types";

export function AddToCartButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const inCart = useAppSelector((state) =>
    state.cart.lines.some(
      (line) =>
        getCartLineKey(line) ===
        getCartLineKey({
          productId: product._id,
          size: product.size,
          color: "",
        })
    )
  );
  const [justAdded, setJustAdded] = useState(false);

  if (product.status !== "available") {
    return (
      <button disabled className="w-full rounded-full bg-patch-bg-alt px-6 py-3 text-sm font-medium text-patch-ink-muted">
        {product.status === "sold" ? "Sold Out" : "Reserved"}
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => {
          dispatch(addToCart({ product, size: product.size, color: "" }));
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1500);
        }}
        disabled={inCart}
        className="flex-1 rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {inCart ? "In Cart" : justAdded ? "Added" : "Add to Cart"}
      </button>
      {inCart && !compact && (
        <button
          onClick={() => router.push("/cart")}
          className="rounded-full border border-patch-line px-6 py-3 text-sm font-medium text-patch-ink"
        >
          View Cart
        </button>
      )}
    </div>
  );
}
