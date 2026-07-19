"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCoupon, getCartLineKey, removeFromCart, setCoupon } from "@/store/slices/cartSlice";
import { formatPrice, isValidImageSrc } from "@/lib/utils";
import type { ApiResponse, CouponValidationResult } from "@/types";

export default function CartPage() {
  const lines = useAppSelector((state) => state.cart.lines);
  const appliedCoupon = useAppSelector((state) => state.cart.couponCode);
  const dispatch = useAppDispatch();
  const [coupon, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
  const shipping = lines.length > 0 ? 0 : 0;

  // Only trust the fetched discount while a coupon is actually applied.
  const effectiveDiscount = appliedCoupon ? discount : 0;

  // Re-check the applied code whenever the cart contents change, so the
  // discount always reflects the current subtotal.
  useEffect(() => {
    if (!appliedCoupon || subtotal === 0) return;
    let cancelled = false;
    axiosInstance
      .post<ApiResponse<CouponValidationResult>>("/coupons/validate", { code: appliedCoupon, subtotal })
      .then(({ data }) => {
        if (!cancelled) setDiscount(data.data.discount);
      })
      .catch((err) => {
        if (cancelled) return;
        setDiscount(0);
        dispatch(clearCoupon());
        setCouponMessage(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "That code is no longer valid."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [appliedCoupon, subtotal, dispatch]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponMessage(null);
    try {
      const { data } = await axiosInstance.post<ApiResponse<CouponValidationResult>>("/coupons/validate", {
        code: coupon,
        subtotal,
      });
      dispatch(setCoupon(data.data.code));
      setCouponInput("");
      setCouponMessage(`Code ${data.data.code} applied.`);
    } catch (err) {
      setCouponMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "That code isn't valid."
      );
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(clearCoupon());
    setDiscount(0);
    setCouponMessage(null);
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-heading text-lg font-medium text-patch-ink">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Your Cart</h1>

      <div className="mt-8 grid gap-10 sm:grid-cols-[1fr_320px]">
        <div className="divide-y divide-patch-line">
          {lines.map((line) => (
            <div key={getCartLineKey(line)} className="flex items-center gap-4 py-5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-none bg-patch-bg-alt">
                {isValidImageSrc(line.image) && (
                  <Image src={line.image} alt={line.name} fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-patch-ink">{line.name}</p>
                <p className="text-xs text-patch-ink-muted">SKU {line.sku}</p>
                <p className="mt-1 text-xs text-patch-ink-muted">
                  {line.size}{line.color ? ` / ${line.color}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm text-patch-ink">{formatPrice(line.price)}</p>
              <button
                onClick={() => dispatch(removeFromCart({ productId: line.productId, size: line.size, color: line.color }))}
                aria-label={`Remove ${line.name}`}
                className="shrink-0 text-patch-ink-muted hover:text-patch-ink"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-none border border-patch-line p-6 sm:sticky sm:top-28">
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-full border border-patch-line px-4 py-2 text-sm">
              <span className="font-medium text-patch-ink">{appliedCoupon}</span>
              <button
                onClick={handleRemoveCoupon}
                aria-label="Remove discount code"
                className="text-patch-ink-muted hover:text-patch-ink"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Discount code"
                className="min-w-0 flex-1 rounded-full border border-patch-line bg-transparent px-4 py-2 text-sm outline-none placeholder:text-patch-ink-muted"
              />
              <button
                onClick={handleApplyCoupon}
                className="rounded-full border border-patch-line px-4 py-2 text-sm font-medium text-patch-ink"
              >
                Apply
              </button>
            </div>
          )}
          {couponMessage && <p className="mt-2 text-xs text-patch-ink-muted">{couponMessage}</p>}

          <div className="mt-6 space-y-2 border-t border-patch-line pt-4 text-sm">
            <div className="flex justify-between text-patch-ink-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {effectiveDiscount > 0 && (
              <div className="flex justify-between text-patch-accent">
                <span>Discount ({appliedCoupon})</span>
                <span>-{formatPrice(effectiveDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-patch-ink-muted">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Calculated at checkout" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-patch-line pt-2 text-base font-medium text-patch-ink">
              <span>Total</span>
              <span>{formatPrice(subtotal - effectiveDiscount)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-full bg-patch-ink px-6 py-3 text-center text-sm font-medium text-patch-bg hover:opacity-90"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
