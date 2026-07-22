"use client";

import { ChevronDown, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { cn, formatPrice } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCoupon } from "@/store/slices/cartSlice";
import type { ApiListResponse, ApiResponse, CouponValidationResult, Order, PaymentMethod, ShippingCity } from "@/types";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "card", label: "Card (Visa / Mastercard)", icon: CreditCard },
];

function Section({
  step,
  title,
  open,
  onToggle,
  children,
}: {
  step: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-patch-line">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3 text-sm font-medium text-patch-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-patch-ink text-xs text-patch-bg">
            {step}
          </span>
          {title}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-patch-line px-5 py-5">{children}</div>}
    </div>
  );
}

export default function CheckoutPage() {
  const lines = useAppSelector((state) => state.cart.lines);
  const couponCode = useAppSelector((state) => state.cart.couponCode);
  const dispatch = useAppDispatch();

  const [openSection, setOpenSection] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    fullName: "",
    phoneLocal: "",
    email: "",
    addressLine: "",
    citySlug: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cities, setCities] = useState<ShippingCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
  const selectedCity = cities.find((city) => city.slug === form.citySlug);
  const shippingCost = selectedCity?.shippingCost ?? 0;
  const effectiveDiscount = couponCode ? discount : 0;
  const total = subtotal + shippingCost - effectiveDiscount;

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get<ApiListResponse<ShippingCity>>("/shipping-cities")
      .then(({ data }) => {
        if (cancelled) return;
        setCities(data.data);
        setForm((current) => {
          if (current.citySlug || data.data.length === 0) return current;
          const dhaka = data.data.find((city) => city.slug === "dhaka");
          return { ...current, citySlug: (dhaka ?? data.data[0]).slug };
        });
      })
      .catch(() => {
        if (!cancelled) setError("Shipping cities are not configured yet. Please contact Patch before checkout.");
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!couponCode || subtotal === 0) return;
    let cancelled = false;
    axiosInstance
      .post<ApiResponse<CouponValidationResult>>("/coupons/validate", { code: couponCode, subtotal })
      .then(({ data }) => {
        if (!cancelled) setDiscount(data.data.discount);
      })
      .catch(() => {
        if (cancelled) return;
        setDiscount(0);
        dispatch(clearCoupon());
      });
    return () => {
      cancelled = true;
    };
  }, [couponCode, subtotal, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!selectedCity) {
      setSubmitting(false);
      setError("Select a shipping city before placing your order.");
      return;
    }

    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>("/orders", {
        items: lines.map((l) => ({
          product: l.productId,
          sku: l.sku,
          name: l.name,
          price: l.price,
          image: l.image,
          size: l.size,
          color: l.color,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: `+880${form.phoneLocal.replace(/\D/g, "")}`,
          email: form.email,
          addressLine: form.addressLine,
          city: selectedCity.name,
          citySlug: selectedCity.slug,
          notes: form.notes,
        },
        paymentMethod,
        couponCode: couponCode || undefined,
      });

      const { data: session } = await axiosInstance.post<ApiResponse<{ url: string }>>(
        "/payments/stripe/checkout-session",
        { orderId: data.data._id }
      );
      window.location.assign(session.data.url);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Something went wrong placing your order.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-patch-ink-muted">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 pb-28 sm:pb-16">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Section step={1} title="Shipping Information" open={openSection === 1} onToggle={() => setOpenSection(1)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
              <PhoneField value={form.phoneLocal} onChange={(v) => setForm({ ...form, phoneLocal: v.replace(/\D/g, "").slice(0, 10) })} />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Address" value={form.addressLine} onChange={(v) => setForm({ ...form, addressLine: v })} required />
            <div>
              <label className="text-xs font-medium text-patch-ink-muted">City</label>
              <div className="relative mt-1">
                <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-patch-ink-muted" />
                <select
                  value={form.citySlug}
                  onChange={(e) => setForm({ ...form, citySlug: e.target.value })}
                  disabled={citiesLoading || cities.length === 0}
                  required
                  className="w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 pl-9 text-sm outline-none focus:border-patch-ink disabled:opacity-60"
                >
                  {cities.length === 0 ? (
                    <option value="" className="bg-patch-bg">
                      No shipping cities configured
                    </option>
                  ) : (
                    cities.map((city) => (
                      <option key={city._id} value={city.slug} className="bg-patch-bg">
                        {city.name}{city.division ? `, ${city.division}` : ""} — {formatPrice(city.shippingCost)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenSection(2)}
              disabled={!selectedCity}
              className="rounded-full bg-patch-ink px-5 py-2 text-sm font-medium text-patch-bg disabled:opacity-50"
            >
              Continue to Payment
            </button>
          </div>
        </Section>

        <Section step={2} title="Payment Method" open={openSection === 2} onToggle={() => setOpenSection(2)}>
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
                    paymentMethod === option.value
                      ? "border-patch-ink bg-patch-ink text-patch-bg"
                      : "border-patch-line text-patch-ink"
                  )}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-patch-ink-muted">
              <ShieldCheck size={14} /> Secure checkout — your payment info is never stored on our servers.
            </div>
            <button
              type="button"
              onClick={() => setOpenSection(3)}
              className="rounded-full bg-patch-ink px-5 py-2 text-sm font-medium text-patch-bg"
            >
              Review Order
            </button>
          </div>
        </Section>

        <Section step={3} title="Review & Place Order" open={openSection === 3} onToggle={() => setOpenSection(3)}>
          <div className="space-y-4">
            <div className="divide-y divide-patch-line">
              {lines.map((line) => (
                <div key={`${line.productId}:${line.size}:${line.color}`} className="flex justify-between py-2 text-sm">
                  <span className="text-patch-ink">
                    {line.name}{" "}
                    <span className="text-patch-ink-muted">
                      ({line.size}{line.color ? ` / ${line.color}` : ""})
                    </span>
                  </span>
                  <span className="text-patch-ink-muted">{formatPrice(line.price)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-patch-line pt-4">
              <div className="flex items-center justify-between text-sm text-patch-ink-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-patch-ink-muted">
                <span>Shipping{selectedCity ? ` (${selectedCity.name})` : ""}</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-patch-accent">
                  <span>Discount ({couponCode})</span>
                  <span>-{formatPrice(effectiveDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-patch-ink">Total</p>
                <p className="text-lg font-semibold text-patch-ink">{formatPrice(total)}</p>
              </div>
            </div>
            <p className="text-xs text-patch-ink-muted">
              By placing this order you agree to our{" "}
              <Link href="/contact" className="underline underline-offset-4">
                exchange policy
              </Link>
              . Patch does not offer cash refunds or returns; size/fit exchanges are available within 7 days.
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !selectedCity}
              className="hidden w-full rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50 sm:block"
            >
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </Section>

        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-patch-line bg-patch-bg px-4 py-3 sm:hidden">
          <div>
            <p className="text-xs text-patch-ink-muted">Total</p>
            <p className="text-sm font-medium text-patch-ink">{formatPrice(total)}</p>
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedCity}
            className="rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg disabled:opacity-50"
          >
            {submitting ? "Placing…" : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
      />
    </div>
  );
}

function PhoneField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">Phone</label>
      <div className="mt-1 flex overflow-hidden rounded-lg border border-patch-line focus-within:border-patch-ink">
        <div className="flex items-center gap-2 border-r border-patch-line bg-patch-bg-alt px-3 text-sm font-medium text-patch-ink">
          <span aria-hidden="true">🇧🇩</span>
          <span>+880</span>
        </div>
        <input
          required
          inputMode="numeric"
          pattern="1[0-9]{9}"
          value={value}
          placeholder="1XXXXXXXXX"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-patch-ink-muted"
        />
      </div>
    </div>
  );
}
