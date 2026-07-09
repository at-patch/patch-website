"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import type { ApiResponse, Product } from "@/types";
import { ProductCard } from "@/components/store/ProductCard";

export default function AccountWishlistPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => axiosInstance.get<ApiResponse<Product[]>>("/account/wishlist");

  const load = async () => {
    const { data } = await fetchWishlist();
    setProducts(data.data);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await fetchWishlist();
        if (cancelled) return;

        setProducts(data.data);
        setLoading(false);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/account/login");
          return;
        }
        throw error;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleRemove = async (productId: string) => {
    await axiosInstance.delete(`/account/wishlist/${productId}`);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/account" className="flex items-center gap-1.5 text-xs font-medium text-patch-ink-muted hover:text-patch-ink">
        <ArrowLeft size={14} /> Back to account
      </Link>

      <h1 className="font-heading mt-4 text-2xl font-extrabold tracking-tight text-patch-ink">Wishlist</h1>

      {loading ? (
        <p className="mt-8 text-sm text-patch-ink-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-sm text-patch-ink-muted">Nothing saved yet — tap the heart on a product to add it here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {products.map((product) => (
            <div key={product._id} className="relative">
              <button
                onClick={() => handleRemove(product._id)}
                aria-label={`Remove ${product.name} from wishlist`}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-patch-bg text-patch-ink shadow-sm"
              >
                <X size={14} />
              </button>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
