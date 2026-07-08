"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, getCartLineKey } from "@/store/slices/cartSlice";
import type { Product } from "@/types";

const EMPTY_VARIANTS: Product["variants"] = [];

export function ProductVariantPicker({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const variants = product.variants ?? EMPTY_VARIANTS;
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const sizes = useMemo(
    () =>
      Array.from(new Set(variants.map((variant) => variant.size))).map((size) => ({
        size,
        inStock: variants.some((variant) => variant.size === size && variant.quantity > 0),
      })),
    [variants]
  );

  const colorsForSize = variants.filter((variant) => variant.size === selectedSize);
  const selectedVariant = variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor
  );

  const inCart = useAppSelector((state) =>
    state.cart.lines.some(
      (line) =>
        getCartLineKey(line) ===
        getCartLineKey({
          productId: product._id,
          size: selectedSize,
          color: selectedColor,
        })
    )
  );

  const canAdd = Boolean(selectedVariant && selectedVariant.quantity > 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-ink-muted">Size</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map(({ size, inStock }) => (
            <button
              key={size}
              type="button"
              disabled={!inStock}
              onClick={() => {
                setSelectedSize(size);
                setSelectedColor("");
              }}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selectedSize === size
                  ? "border-patch-ink bg-patch-ink text-patch-bg"
                  : "border-patch-line text-patch-ink"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {selectedSize && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-ink-muted">Color</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {colorsForSize.map((variant) => (
              <button
                key={`${variant.size}-${variant.color}`}
                type="button"
                disabled={variant.quantity < 1}
                onClick={() => setSelectedColor(variant.color)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedColor === variant.color
                    ? "border-patch-ink bg-patch-ink text-patch-bg"
                    : "border-patch-line text-patch-ink"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {variant.color}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-patch-ink-muted">
        {!selectedSize
          ? "Choose a size to see available colors."
          : !selectedColor
            ? "Choose a color to continue."
            : selectedVariant && selectedVariant.quantity > 0
              ? `${selectedVariant.quantity} left in stock`
              : "Out of stock"}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!canAdd || inCart}
          onClick={() => {
            if (!selectedVariant) return;
            dispatch(
              addToCart({
                product,
                size: selectedVariant.size,
                color: selectedVariant.color,
              })
            );
          }}
          className="flex-1 rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {inCart ? "In Cart" : "Add to Cart"}
        </button>
        {inCart && (
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="rounded-full border border-patch-line px-6 py-3 text-sm font-medium text-patch-ink"
          >
            View Cart
          </button>
        )}
      </div>
    </div>
  );
}
