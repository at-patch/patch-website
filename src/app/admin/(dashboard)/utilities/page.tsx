"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, Search, Settings2, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, ShippingCity } from "@/types";

const EMPTY_FORM = {
  name: "",
  division: "",
  shippingCost: "",
  isActive: true,
};

export default function UtilitiesPage() {
  const [cities, setCities] = useState<ShippingCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<ShippingCity>>("/admin/shipping-cities");
    setCities(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => `${city.name} ${city.division}`.toLowerCase().includes(q));
  }, [cities, query]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axiosInstance.post("/admin/shipping-cities", {
        ...form,
        shippingCost: Number(form.shippingCost),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save city.");
    }
  };

  const seedCities = async () => {
    setError(null);
    try {
      await axiosInstance.put("/admin/shipping-cities");
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to seed cities.");
    }
  };

  const updateCity = async (city: ShippingCity, patch: Partial<ShippingCity>) => {
    await axiosInstance.patch(`/admin/shipping-cities/${city._id}`, patch);
    load();
  };

  const removeCity = async (id: string) => {
    await axiosInstance.delete(`/admin/shipping-cities/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Settings2}
        title="Utilities"
        description="Manage shipping cities and delivery charges used during checkout."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={MapPin} onClick={seedCities}>
              Seed Bangladesh cities
            </Button>
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              Add city
            </Button>
          </div>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-patch-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cities..."
            className="w-full rounded-xl border border-patch-line bg-patch-bg px-3.5 py-2.5 pl-10 text-sm text-patch-ink outline-none focus:border-patch-accent"
          />
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} icon={MapPin} title="New shipping city" description="Add a custom city or delivery area">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <FormInput icon={MapPin} label="City" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <FormInput icon={MapPin} label="Division" value={form.division} onChange={(v) => setForm({ ...form, division: v })} />
          <FormInput icon={Settings2} label="Shipping cost" type="number" value={form.shippingCost} onChange={(v) => setForm({ ...form, shippingCost: v })} required />
          <label className="mt-7 flex items-center gap-2 text-sm text-patch-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-patch-accent"
            />
            Active at checkout
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit">Save city</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>City</th>
            <th className={tableCellClass}>Division</th>
            <th className={tableCellClass}>Shipping Cost</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={MapPin} title="No shipping cities" description="Seed Bangladesh cities or add a custom city to enable checkout shipping." />
              </td>
            </tr>
          ) : (
            filtered.map((city) => (
              <tr key={city._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <input
                    defaultValue={city.name}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== city.name) updateCity(city, { name: next });
                    }}
                    className="w-40 rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm font-medium text-patch-ink outline-none focus:border-patch-accent"
                    aria-label={`City name for ${city.name}`}
                  />
                </td>
                <td className={tableCellClass}>
                  <input
                    defaultValue={city.division ?? ""}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next !== (city.division ?? "")) updateCity(city, { division: next });
                    }}
                    className="w-36 rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm text-patch-ink-muted outline-none focus:border-patch-accent"
                    aria-label={`Division for ${city.name}`}
                  />
                </td>
                <td className={tableCellClass}>
                  <input
                    type="number"
                    defaultValue={city.shippingCost}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (next !== city.shippingCost) updateCity(city, { shippingCost: next });
                    }}
                    className="w-28 rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm text-patch-ink outline-none focus:border-patch-accent"
                    aria-label={`Shipping cost for ${city.name}`}
                  />
                  <span className="ml-2 text-xs text-patch-ink-muted">{formatPrice(city.shippingCost)}</span>
                </td>
                <td className={tableCellClass}>
                  <button type="button" onClick={() => updateCity(city, { isActive: !city.isActive })}>
                    <Badge tone={city.isActive ? "green" : "neutral"}>{city.isActive ? "Active" : "Inactive"}</Badge>
                  </button>
                </td>
                <td className={tableCellClass}>
                  <Button type="button" variant="ghost" icon={Trash2} onClick={() => removeCity(city._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
