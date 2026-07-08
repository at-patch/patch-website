"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { cn, formatPrice } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import type { ApiResponse, Order, PaymentMethod } from "@/types";

const AREAS = ["gulshan", "banani", "baridhara", "other"] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card (Visa / Mastercard)" },
  { value: "cod", label: "Cash on Delivery" },
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
  const router = useRouter();

  const [openSection, setOpenSection] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    area: "gulshan" as (typeof AREAS)[number],
    city: "Dhaka",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => sum + l.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>("/orders", {
        items: lines.map((l) => ({
          product: l.productId,
          sku: l.sku,
          name: l.name,
          price: l.price,
          image: l.image,
        })),
        shippingAddress: form,
        paymentMethod,
      });

      if (paymentMethod === "card") {
        const { data: session } = await axiosInstance.post<ApiResponse<{ url: string }>>(
          "/payments/stripe/checkout-session",
          { orderId: data.data._id }
        );
        window.location.href = session.data.url;
        return;
      }

      router.push(`/checkout/success?order=${data.data.orderNumber}`);
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
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Address" value={form.addressLine} onChange={(v) => setForm({ ...form, addressLine: v })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-patch-ink-muted">Area</label>
                <select
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value as typeof form.area })}
                  className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm"
                >
                  {AREAS.map((area) => (
                    <option key={area} value={area} className="bg-patch-bg">
                      {area[0].toUpperCase() + area.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            </div>
            <button
              type="button"
              onClick={() => setOpenSection(2)}
              className="rounded-full bg-patch-ink px-5 py-2 text-sm font-medium text-patch-bg"
            >
              Continue to Payment
            </button>
          </div>
        </Section>

        <Section step={2} title="Payment Method" open={openSection === 2} onToggle={() => setOpenSection(2)}>
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-medium",
                    paymentMethod === option.value
                      ? "border-patch-ink bg-patch-ink text-patch-bg"
                      : "border-patch-line text-patch-ink"
                  )}
                >
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
                <div key={line.productId} className="flex justify-between py-2 text-sm">
                  <span className="text-patch-ink">{line.name}</span>
                  <span className="text-patch-ink-muted">{formatPrice(line.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-patch-line pt-4">
              <p className="text-sm font-medium text-patch-ink">Total</p>
              <p className="text-lg font-semibold text-patch-ink">{formatPrice(total)}</p>
            </div>
            <p className="text-xs text-patch-ink-muted">
              By placing this order you agree to our{" "}
              <Link href="/contact" className="underline underline-offset-4">
                return policy
              </Link>
              .
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
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
            disabled={submitting}
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
