"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import type { ApiListResponse, ApiResponse, Customer, Order } from "@/types";

const AREAS = ["gulshan", "banani", "baridhara", "other"] as const;

export default function AccountDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine: "",
    area: "gulshan" as (typeof AREAS)[number],
    city: "Dhaka",
  });

  const load = async () => {
    const [{ data: me }, { data: orderData }] = await Promise.all([
      axiosInstance.get<ApiResponse<Customer>>("/account/me"),
      axiosInstance.get<ApiListResponse<Order>>("/account/orders"),
    ]);
    setCustomer(me.data);
    setProfileForm({ name: me.data.name, phone: me.data.phone });
    setOrders(orderData.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const handleLogout = async () => {
    await axiosInstance.post("/account/logout");
    router.push("/account/login");
    router.refresh();
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await axiosInstance.patch("/account/me", profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await axiosInstance.post("/account/addresses", addressForm);
    setShowAddressForm(false);
    setAddressForm({ label: "Home", fullName: "", phone: "", addressLine: "", area: "gulshan", city: "Dhaka" });
    load();
  };

  const handleRemoveAddress = async (addressId: string) => {
    await axiosInstance.delete(`/account/addresses/${addressId}`);
    load();
  };

  if (!customer) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-patch-ink-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">My Account</h1>
          <p className="mt-1 text-sm text-patch-ink-muted">{customer.email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-patch-ink-muted underline underline-offset-4">
          Logout
        </button>
      </div>

      <Link
        href="/account/wishlist"
        className="mt-6 flex items-center gap-1.5 text-sm font-medium text-patch-ink underline underline-offset-4"
      >
        <Heart size={14} /> View wishlist
      </Link>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-patch-ink">Order History</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-patch-ink-muted">No orders yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-patch-line border-y border-patch-line">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-patch-ink">{order.orderNumber}</p>
                  <p className="text-xs text-patch-ink-muted">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.status}
                  </p>
                </div>
                <p className="text-patch-ink">{formatPrice(order.total, order.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-patch-ink">Saved Addresses</h2>
          <button
            onClick={() => setShowAddressForm((v) => !v)}
            className="text-xs font-medium text-patch-ink underline underline-offset-4"
          >
            {showAddressForm ? "Cancel" : "Add address"}
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="mt-4 grid gap-3 rounded-lg border border-patch-line p-4 sm:grid-cols-2">
            <Field label="Label" value={addressForm.label} onChange={(v) => setAddressForm({ ...addressForm, label: v })} />
            <Field label="Full name" value={addressForm.fullName} onChange={(v) => setAddressForm({ ...addressForm, fullName: v })} required />
            <Field label="Phone" value={addressForm.phone} onChange={(v) => setAddressForm({ ...addressForm, phone: v })} required />
            <div>
              <label className="text-xs font-medium text-patch-ink-muted">Area</label>
              <select
                value={addressForm.area}
                onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value as typeof addressForm.area })}
                className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm"
              >
                {AREAS.map((area) => (
                  <option key={area} value={area} className="bg-patch-bg">
                    {area[0].toUpperCase() + area.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Field label="City" value={addressForm.city} onChange={(v) => setAddressForm({ ...addressForm, city: v })} required />
            <div className="sm:col-span-2">
              <Field label="Address" value={addressForm.addressLine} onChange={(v) => setAddressForm({ ...addressForm, addressLine: v })} required />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-full bg-patch-ink px-5 py-2 text-sm font-medium text-patch-bg">
                Save address
              </button>
            </div>
          </form>
        )}

        {customer.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-patch-ink-muted">No saved addresses yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {customer.addresses.map((addr) => (
              <div key={addr._id} className="flex items-start justify-between rounded-lg border border-patch-line p-4 text-sm">
                <div>
                  <p className="font-medium text-patch-ink">{addr.label} — {addr.fullName}</p>
                  <p className="text-patch-ink-muted">{addr.addressLine}, {addr.area}, {addr.city}</p>
                  <p className="text-patch-ink-muted">{addr.phone}</p>
                </div>
                <button onClick={() => handleRemoveAddress(addr._id)} aria-label="Remove address" className="text-patch-ink-muted hover:text-patch-ink">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-patch-ink">Account Details</h2>
        <form onSubmit={handleProfileSave} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={profileForm.name} onChange={(v) => setProfileForm({ ...profileForm, name: v })} required />
          <Field label="Phone" value={profileForm.phone} onChange={(v) => setProfileForm({ ...profileForm, phone: v })} required />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-full bg-patch-ink px-5 py-2 text-sm font-medium text-patch-bg">
              Save changes
            </button>
            {profileSaved && <span className="ml-3 text-sm text-patch-accent">Saved.</span>}
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
      />
    </div>
  );
}
