"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    const res = await fetch("/api/account/wishlist");
    if (res.status === 401) {
      setLoggedIn(false);
      return;
    }
    const body = await res.json();
    const ids: string[] = (body.data ?? []).map((product: { _id: string }) => product._id);
    setSaved(ids.includes(productId));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    loadStatus().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the product changes
  }, [productId]);

  const toggle = async () => {
    if (!loggedIn) {
      router.push("/account/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await fetch(`/api/account/wishlist/${productId}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-patch-line text-patch-ink transition-colors hover:border-patch-ink disabled:opacity-50"
    >
      <Heart size={18} className={cn(saved && "fill-patch-accent text-patch-accent")} />
    </button>
  );
}
