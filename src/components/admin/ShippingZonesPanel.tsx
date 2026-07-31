"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Globe2, MapPin, Plus, Search, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import type { ApiListResponse, ShippingZone } from "@/types";
import { Badge, Button, Card, ErrorBanner, FormInput, Modal } from "@/components/admin/ui";

const EMPTY_COUNTRY_FORM = {
  countryCode: "",
  countryName: "",
  baseRate: "",
  additionalKgRate: "",
  currency: "BDT",
  isActive: true,
};

export function ShippingZonesPanel() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_COUNTRY_FORM);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<ApiListResponse<ShippingZone>>("/admin/shipping-zones");
      setZones(data.data);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to load shipping rules."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
  }, []);

  const grouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const visible = normalizedQuery
      ? zones.filter((zone) =>
          `${zone.countryName} ${zone.countryCode} ${zone.district ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery)
        )
      : zones;

    const countries = new Map<string, ShippingZone[]>();
    for (const zone of visible) {
      const existing = countries.get(zone.countryCode) ?? [];
      existing.push(zone);
      countries.set(zone.countryCode, existing);
    }
    return Array.from(countries.entries()).sort(([, a], [, b]) =>
      a[0].countryName.localeCompare(b[0].countryName)
    );
  }, [query, zones]);

  const seedBangladesh = async () => {
    setError(null);
    try {
      await axiosInstance.put("/admin/shipping-zones");
      await load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to seed Bangladesh districts."
      );
    }
  };

  const createCountry = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await axiosInstance.post("/admin/shipping-zones", {
        countryCode: form.countryCode,
        countryName: form.countryName,
        scope: "country",
        baseRate: Number(form.baseRate),
        additionalKgRate: Number(form.additionalKgRate),
        currency: form.currency,
        isActive: form.isActive,
      });
      setForm(EMPTY_COUNTRY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to create country shipping rule."
      );
    }
  };

  const updateZone = async (zone: ShippingZone, patch: Partial<ShippingZone>) => {
    setError(null);
    try {
      await axiosInstance.patch(`/admin/shipping-zones/${zone._id}`, patch);
      await load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to update shipping rule."
      );
    }
  };

  const removeZone = async (zone: ShippingZone) => {
    if (!window.confirm(`Delete the shipping rule for ${zone.district || zone.countryName}?`)) return;
    await axiosInstance.delete(`/admin/shipping-zones/${zone._id}`);
    await load();
  };

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold text-patch-ink">Dynamic shipping rules</p>
          <p className="mt-1 text-sm text-patch-ink-muted">
            Country-wide international rates and district-level Bangladesh rates, charged by weight.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={MapPin} onClick={seedBangladesh}>
            Seed 64 districts
          </Button>
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            Add country
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-patch-ink-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search country or district..."
            className="w-full rounded-xl border border-patch-line bg-patch-bg py-2.5 pl-10 pr-3.5 text-sm text-patch-ink outline-none focus:border-patch-accent"
          />
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        icon={Globe2}
        title="International shipping country"
        description="One country-wide rule applies to every address in this country."
      >
        <form onSubmit={createCountry} className="grid gap-4 sm:grid-cols-2">
          <FormInput
            icon={Globe2}
            label="Country code"
            value={form.countryCode}
            onChange={(value) => setForm({ ...form, countryCode: value.toUpperCase().slice(0, 2) })}
            placeholder="US"
            required
          />
          <FormInput
            icon={Globe2}
            label="Country name"
            value={form.countryName}
            onChange={(value) => setForm({ ...form, countryName: value })}
            placeholder="United States"
            required
          />
          <FormInput
            label="First 1 kg rate"
            type="number"
            value={form.baseRate}
            onChange={(value) => setForm({ ...form, baseRate: value })}
            required
          />
          <FormInput
            label="Each additional kg"
            type="number"
            value={form.additionalKgRate}
            onChange={(value) => setForm({ ...form, additionalKgRate: value })}
            required
          />
          <FormInput
            label="Rate currency"
            value={form.currency}
            onChange={(value) => setForm({ ...form, currency: value.toUpperCase().slice(0, 3) })}
            required
          />
          <label className="mt-7 flex items-center gap-2 text-sm text-patch-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="accent-patch-accent"
            />
            Active at checkout
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Save country</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <div className="mt-5 space-y-3">
        {loading ? (
          <Card className="animate-pulse p-6">
            <div className="h-16 rounded-xl bg-patch-ink/5" />
          </Card>
        ) : grouped.length === 0 ? (
          <Card className="p-8 text-center text-sm text-patch-ink-muted">
            No shipping destinations match this search.
          </Card>
        ) : (
          grouped.map(([countryCode, countryZones]) => (
            <details key={countryCode} className="group rounded-2xl border border-patch-line bg-patch-bg" open={countryCode === "BD"}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-patch-ink/5 text-patch-ink">
                    <Globe2 size={17} />
                  </span>
                  <span>
                    <span className="block font-medium text-patch-ink">{countryZones[0].countryName}</span>
                    <span className="block text-xs text-patch-ink-muted">
                      {countryCode} · {countryZones.length} {countryZones.length === 1 ? "rule" : "districts"}
                    </span>
                  </span>
                </span>
                <ChevronDown size={18} className="text-patch-ink-muted transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-patch-line px-5 py-3">
                <div className="grid grid-cols-[minmax(10rem,1fr)_8rem_8rem_6rem_3rem] gap-3 border-b border-patch-line pb-2 text-[11px] font-semibold uppercase tracking-wide text-patch-ink-muted">
                  <span>Destination</span>
                  <span>First kg</span>
                  <span>Additional kg</span>
                  <span>Status</span>
                  <span />
                </div>
                {countryZones.map((zone) => (
                  <div
                    key={zone._id}
                    className="grid grid-cols-[minmax(10rem,1fr)_8rem_8rem_6rem_3rem] items-center gap-3 border-b border-patch-line py-3 last:border-b-0"
                  >
                    <span className="truncate text-sm text-patch-ink">{zone.district || zone.countryName}</span>
                    <input
                      type="number"
                      defaultValue={zone.baseRate}
                      onBlur={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isFinite(next) && next !== zone.baseRate) updateZone(zone, { baseRate: next });
                      }}
                      className="w-full rounded-lg border border-patch-line bg-transparent px-2.5 py-2 text-sm text-patch-ink outline-none focus:border-patch-accent"
                      aria-label={`First kg rate for ${zone.district || zone.countryName}`}
                    />
                    <input
                      type="number"
                      defaultValue={zone.additionalKgRate}
                      onBlur={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isFinite(next) && next !== zone.additionalKgRate) {
                          updateZone(zone, { additionalKgRate: next });
                        }
                      }}
                      className="w-full rounded-lg border border-patch-line bg-transparent px-2.5 py-2 text-sm text-patch-ink outline-none focus:border-patch-accent"
                      aria-label={`Additional kg rate for ${zone.district || zone.countryName}`}
                    />
                    <button type="button" onClick={() => updateZone(zone, { isActive: !zone.isActive })}>
                      <Badge tone={zone.isActive ? "green" : "neutral"}>
                        {zone.isActive ? "On" : "Off"}
                      </Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeZone(zone)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10"
                      aria-label={`Delete ${zone.district || zone.countryName} shipping rule`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}
