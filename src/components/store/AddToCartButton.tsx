"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, getCartLineKey } from "@/store/slices/cartSlice";
import { startBuyNow } from "@/store/slices/checkoutSlice";
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
  const [buying, setBuying] = useState(false);

  if (product.status !== "available") {
    return (
      <button disabled className="w-full rounded-full bg-patch-bg-alt px-6 py-3 text-sm font-medium text-patch-ink-muted">
        {product.status === "sold" ? "Sold Out" : "Reserved"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
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
      {/* The sticky mobile bar stays a single quick action; Buy Now lives in the
          main product body where the full selection is visible. */}
      {!compact && (
        <button
          onClick={() => {
            setBuying(true);
            dispatch(startBuyNow({ product, size: product.size, color: "" }));
            router.push("/checkout?mode=buy-now");
          }}
          disabled={buying}
          className="w-full rounded-full border border-patch-ink px-6 py-3 text-sm font-medium text-patch-ink transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {buying ? "Taking you to checkout…" : "Buy Now"}
        </button>
      )}
    </div>
  );
}
