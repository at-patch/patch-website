"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Sparkle } from "lucide-react";
import { formatPrice, isValidImageSrc } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const images = product.images.filter(isValidImageSrc);
  const secondImage = images[1] ?? images[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-patch-bg-alt">
        {images[0] ? (
          <>
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={product.name}
                fill
                className="object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-patch-ink-muted">
            No image
          </div>
        )}

        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-patch-accent px-2.5 py-1 text-[11px] font-semibold tracking-wide text-patch-accent-ink shadow-sm">
          <Sparkle size={11} className="shrink-0" strokeWidth={2.5} />
          {product.batchLabel}
        </span>

        {product.status === "available" && product.rarity !== "multi-quantity" && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(addToCart({ product, size: product.size, color: "" }));
            }}
            aria-label={`Quick add ${product.name} to cart`}
            className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-patch-ink text-patch-bg opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-patch-ink">{product.name}</p>
          <p className="text-xs text-patch-ink-muted">{product.materials.join(", ")}</p>
        </div>
        <p className="whitespace-nowrap text-sm font-bold text-patch-ink">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}
