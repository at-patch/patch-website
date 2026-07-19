"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Hash, Pencil, Percent, Plus, Trash2, Type } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSelect,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Coupon, CouponType } from "@/types";

const emptyForm = {
  code: "",
  type: "percent" as CouponType,
  value: "10",
  minSubtotal: "0",
  expiresAt: "",
  usageLimit: "0",
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Coupon>>("/admin/coupons");
    setCoupons(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minSubtotal: Number(form.minSubtotal),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: Number(form.usageLimit),
      active: form.active,
    };

    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/coupons/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/coupons", payload);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save coupon.");
    }
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minSubtotal: String(c.minSubtotal),
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      usageLimit: String(c.usageLimit),
      active: c.active,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const deleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete "${code}"? This can't be undone.`)) return;
    await axiosInstance.delete(`/admin/coupons/${id}`);
    load();
  };

  const describeValue = (c: Coupon) => (c.type === "percent" ? `${c.value}% off` : `${formatPrice(c.value)} off`);

  const describeUsage = (c: Coupon) => (c.usageLimit > 0 ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount} / ∞`);

  const isExpired = (c: Coupon) => Boolean(c.expiresAt && new Date(c.expiresAt) < new Date());

  return (
    <div>
      <PageHeader
        icon={Percent}
        title="Coupons"
        description="Discount codes customers can apply in the cart."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            New coupon
          </Button>
        }
      />

      <Modal
        open={showForm}
        onClose={cancelForm}
        icon={Percent}
        title={editingId ? "Editing coupon" : "New coupon"}
        description={editingId ? `Updating ${form.code}` : "Create a discount code for the shop"}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormInput icon={Type} label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} required placeholder="WELCOME10" />
          <FormSelect icon={Percent} label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as CouponType })}>
            <option value="percent">Percent off</option>
            <option value="flat">Flat amount off</option>
          </FormSelect>
          <FormInput icon={Hash} label={form.type === "percent" ? "Percent (%)" : "Amount (BDT)"} type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} required />
          <FormInput icon={Hash} label="Minimum subtotal (0 = none)" type="number" value={form.minSubtotal} onChange={(v) => setForm({ ...form, minSubtotal: v })} />
          <FormInput icon={CalendarClock} label="Expires (optional)" type="date" value={form.expiresAt} onChange={(v) => setForm({ ...form, expiresAt: v })} />
          <FormInput icon={Hash} label="Usage limit (0 = unlimited)" type="number" value={form.usageLimit} onChange={(v) => setForm({ ...form, usageLimit: v })} />
          <label className="flex items-center gap-2 text-sm text-patch-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-patch-ink"
            />
            Active
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit">{editingId ? "Update coupon" : "Save coupon"}</Button>
            <Button type="button" variant="ghost" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
          {error && (
            <div className="sm:col-span-2">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}
        </form>
      </Modal>

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Code</th>
            <th className={tableCellClass}>Discount</th>
            <th className={tableCellClass}>Min. subtotal</th>
            <th className={tableCellClass}>Usage</th>
            <th className={tableCellClass}>Expires</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={7}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : coupons.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState icon={Percent} title="No coupons yet" description="Create a code to run your first promotion." />
              </td>
            </tr>
          ) : (
            coupons.map((c) => (
              <tr key={c._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-mono text-sm font-medium text-patch-ink`}>{c.code}</td>
                <td className={`${tableCellClass} text-patch-ink`}>{describeValue(c)}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>
                  {c.minSubtotal > 0 ? formatPrice(c.minSubtotal) : "—"}
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{describeUsage(c)}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className={tableCellClass}>
                  {!c.active ? (
                    <Badge tone="neutral">inactive</Badge>
                  ) : isExpired(c) ? (
                    <Badge tone="rust">expired</Badge>
                  ) : (
                    <Badge tone="green">active</Badge>
                  )}
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={Pencil} label="Edit coupon" onClick={() => startEdit(c)} />
                    <IconButton icon={Trash2} label="Delete coupon" tone="danger" onClick={() => deleteCoupon(c._id, c.code)} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
