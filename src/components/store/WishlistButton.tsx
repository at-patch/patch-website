"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function WishlistButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button
      onClick={() => setSaved((v) => !v)}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-patch-line text-patch-ink transition-colors hover:border-patch-ink"
    >
      <Heart size={18} className={cn(saved && "fill-patch-accent text-patch-accent")} />
    </button>
  );
}
