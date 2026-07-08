"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import type { Product } from "@/types";

export function StickyAddToCartBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} />
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-patch-line bg-patch-bg px-4 py-3 sm:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-patch-ink">{product.name}</p>
            <p className="text-xs text-patch-ink-muted">{formatPrice(product.price, product.currency)}</p>
          </div>
          <div className="w-36 shrink-0">
            <AddToCartButton product={product} compact />
          </div>
        </div>
      )}
    </>
  );
}
