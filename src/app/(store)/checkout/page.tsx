"use client";

import { ChevronDown, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCoupon } from "@/store/slices/cartSlice";
import type {
  ApiListResponse,
  ApiResponse,
  CouponValidationResult,
  CourierClass,
  Order,
  PaymentMethod,
  ShippingDestination,
  ShippingQuote,
} from "@/types";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "card", label: "Card (Visa / Mastercard)", icon: CreditCard },
];

const COURIER_CLASS_LABELS: Record<CourierClass, string> = {
  premium: "Premium",
  express: "Express",
  economy: "Economy",
};

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
  const { currency, format } = useCurrency();

  const [openSection, setOpenSection] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    countryCode: "BD",
    districtSlug: "",
    city: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [destinations, setDestinations] = useState<ShippingDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [quoteState, setQuoteState] = useState<{ key: string; quote: ShippingQuote } | null>(null);
  const [selectedCourierClass, setSelectedCourierClass] = useState<CourierClass | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
  const countries = Array.from(
    new Map(destinations.map((destination) => [destination.countryCode, destination])).values()
  );
  const districts = destinations.filter(
    (destination) => destination.countryCode === form.countryCode && destination.scope === "district"
  );
  const selectedDestination =
    form.countryCode === "BD"
      ? districts.find((destination) => destination.districtSlug === form.districtSlug)
      : destinations.find(
          (destination) => destination.countryCode === form.countryCode && destination.scope === "country"
        );
  const quoteKey = `${selectedDestination?.id ?? ""}:${lines.map((line) => line.productId).join(",")}`;
  const quote = quoteState?.key === quoteKey ? quoteState.quote : null;
  const selectedClassOption = quote?.availableClasses?.find(
    (option) => option.courierClass === selectedCourierClass
  );
  const shippingCost = selectedClassOption?.shippingCost ?? quote?.shippingCost ?? 0;
  const effectiveDiscount = couponCode ? discount : 0;
  const total = subtotal + shippingCost - effectiveDiscount;

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get<ApiListResponse<ShippingDestination>>("/shipping-destinations")
      .then(({ data }) => {
        if (cancelled) return;
        setDestinations(data.data);
        setForm((current) => {
          if (data.data.length === 0) return current;
          const dhaka = data.data.find(
            (destination) => destination.countryCode === "BD" && destination.districtSlug === "dhaka"
          );
          const first = dhaka ?? data.data[0];
          return {
            ...current,
            countryCode: first.countryCode,
            districtSlug: first.districtSlug ?? "",
            city: first.district ?? current.city,
          };
        });
      })
      .catch(() => {
        if (!cancelled) setError("Shipping destinations are not configured yet. Please contact Patch before checkout.");
      })
      .finally(() => {
        if (!cancelled) setDestinationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDestination || lines.length === 0) return;
    let cancelled = false;
    const requestKey = quoteKey;
    axiosInstance
      .post<ApiResponse<ShippingQuote>>("/shipping-quote", {
        productIds: lines.map((line) => line.productId),
        countryCode: selectedDestination.countryCode,
        districtSlug: selectedDestination.districtSlug,
      })
      .then(({ data }) => {
        if (cancelled) return;
        setQuoteState({ key: requestKey, quote: data.data });
        setSelectedCourierClass(data.data.courierClass ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Unable to calculate shipping."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [lines, quoteKey, selectedDestination]);

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

    if (!selectedDestination || !quote) {
      setSubmitting(false);
      setError("Select a shipping destination and wait for the shipping quote.");
      return;
    }

    if (quote.availableClasses && quote.availableClasses.length > 0 && !selectedCourierClass) {
      setSubmitting(false);
      setError("Select a courier class.");
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
          phone: form.phone,
          email: form.email,
          addressLine: form.addressLine,
          city: form.city,
          citySlug: form.districtSlug,
          countryCode: form.countryCode,
          district: selectedDestination.district,
          districtSlug: selectedDestination.districtSlug,
          notes: form.notes,
        },
        paymentMethod,
        currency,
        couponCode: couponCode || undefined,
        courierClass: selectedCourierClass ?? undefined,
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
              <PhoneField value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Address" value={form.addressLine} onChange={(v) => setForm({ ...form, addressLine: v })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-patch-ink-muted">Country</label>
                <div className="relative mt-1">
                  <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-patch-ink-muted" />
                  <select
                    value={form.countryCode}
                    onChange={(event) => {
                      const countryCode = event.target.value;
                      const firstDistrict = destinations.find(
                        (destination) => destination.countryCode === countryCode && destination.scope === "district"
                      );
                      setForm({
                        ...form,
                        countryCode,
                        districtSlug: firstDistrict?.districtSlug ?? "",
                        city: firstDistrict?.district ?? "",
                      });
                    }}
                    disabled={destinationsLoading || countries.length === 0}
                    required
                    className="w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 pl-9 text-sm outline-none focus:border-patch-ink disabled:opacity-60"
                  >
                    {countries.map((country) => (
                      <option key={country.countryCode} value={country.countryCode} className="bg-patch-bg">
                        {country.countryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {form.countryCode === "BD" && (
                <div>
                  <label className="text-xs font-medium text-patch-ink-muted">District</label>
                  <select
                    value={form.districtSlug}
                    onChange={(event) => {
                      const destination = districts.find(
                        (item) => item.districtSlug === event.target.value
                      );
                      setForm({
                        ...form,
                        districtSlug: event.target.value,
                        city: destination?.district ?? form.city,
                      });
                    }}
                    disabled={destinationsLoading || districts.length === 0}
                    required
                    className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink disabled:opacity-60"
                  >
                    {districts.map((destination) => (
                      <option key={destination.id} value={destination.districtSlug} className="bg-patch-bg">
                        {destination.district}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-patch-ink-muted">City / locality</label>
              <div className="relative mt-1">
                <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-patch-ink-muted" />
                <input
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  required
                  placeholder="City or locality"
                  className="w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 pl-9 text-sm outline-none focus:border-patch-ink"
                />
              </div>
            </div>
            {quote?.availableClasses && quote.availableClasses.length > 0 && (
              <div>
                <label className="text-xs font-medium text-patch-ink-muted">Courier class</label>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {quote.availableClasses.map((option) => (
                    <button
                      key={option.courierClass}
                      type="button"
                      onClick={() => setSelectedCourierClass(option.courierClass)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-sm",
                        selectedCourierClass === option.courierClass
                          ? "border-patch-ink bg-patch-ink text-patch-bg"
                          : "border-patch-line text-patch-ink"
                      )}
                    >
                      <span className="font-medium">{COURIER_CLASS_LABELS[option.courierClass]}</span>
                      <span
                        className={cn(
                          "text-xs",
                          selectedCourierClass === option.courierClass ? "text-patch-bg/80" : "text-patch-ink-muted"
                        )}
                      >
                        {format(option.shippingCost)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpenSection(2)}
              disabled={
                !selectedDestination ||
                !quote ||
                !form.city ||
                (Boolean(quote.availableClasses?.length) && !selectedCourierClass)
              }
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
                  <span className="text-patch-ink-muted">{format(line.price)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-patch-line pt-4">
              <div className="flex items-center justify-between text-sm text-patch-ink-muted">
                <span>Subtotal</span>
                <span>{format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-patch-ink-muted">
                <span>
                  Shipping
                  {selectedDestination
                    ? ` (${selectedDestination.district || selectedDestination.countryName}${
                        selectedCourierClass ? ` – ${COURIER_CLASS_LABELS[selectedCourierClass]}` : ""
                      })`
                    : ""}
                </span>
                <span>{quote ? format(shippingCost) : "Calculating..."}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-patch-ink-muted">
                <span>Cart weight</span>
                <span>
                  {quote
                    ? `${quote.totalWeightKg.toFixed(2)} kg (${quote.chargeableWeightKg} kg chargeable)`
                    : "Waiting for quote"}
                </span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-patch-accent">
                  <span>Discount ({couponCode})</span>
                  <span>-{format(effectiveDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-patch-ink">Total</p>
                <p className="text-lg font-semibold text-patch-ink">{format(total)}</p>
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
              disabled={
                submitting ||
                !selectedDestination ||
                !quote ||
                !form.city ||
                (Boolean(quote?.availableClasses?.length) && !selectedCourierClass)
              }
              className="hidden w-full rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50 sm:block"
            >
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </Section>

        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-patch-line bg-patch-bg px-4 py-3 sm:hidden">
          <div>
            <p className="text-xs text-patch-ink-muted">Total</p>
            <p className="text-sm font-medium text-patch-ink">{format(total)}</p>
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedDestination || !quote || !form.city}
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
        <input
          required
          inputMode="tel"
          pattern="\+[1-9][0-9]{7,14}"
          value={value}
          placeholder="+8801XXXXXXXXX"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-patch-ink-muted"
        />
      </div>
    </div>
  );
}
