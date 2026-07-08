"use client";

import { useEffect, useState } from "react";
import { FileText, Hash, Plus, Recycle, Ruler, Scale, Shirt } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSelect,
  Modal,
  PageHeader,
  StatusPillSelect,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
  type Tone,
} from "@/components/admin/ui";
import type { ApiListResponse, InventoryItem, InventorySourceType, InventoryUnit } from "@/types";

const SOURCE_TYPES: InventorySourceType[] = ["donated", "purchased", "factory-offcut", "returned-garment"];
const UNITS: InventoryUnit[] = ["kg", "pieces", "meters"];
const STATUSES: InventoryItem["status"][] = ["raw", "processing", "converted", "discarded"];

const STATUS_TONE: Record<InventoryItem["status"], Tone> = {
  raw: "rust",
  processing: "teal",
  converted: "green",
  discarded: "neutral",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    itemCode: "",
    materialType: "",
    sourceType: "donated" as InventorySourceType,
    quantity: "",
    unit: "pieces" as InventoryUnit,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<InventoryItem>>("/admin/inventory");
    setItems(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axiosInstance.post("/admin/inventory", { ...form, quantity: Number(form.quantity) });
      setForm({ itemCode: "", materialType: "", sourceType: "donated", quantity: "", unit: "pieces", notes: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add item.");
    }
  };

  const updateStatus = async (id: string, status: InventoryItem["status"]) => {
    await axiosInstance.patch(`/admin/inventory/${id}`, { status });
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Recycle}
        title="Inventory"
        description="Track raw materials as they move through the reclaim pipeline."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            Log new material
          </Button>
        }
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} icon={Recycle} title="New material" description="Log incoming raw material into the pipeline">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <FormInput icon={Hash} label="Item code" value={form.itemCode} onChange={(v) => setForm({ ...form, itemCode: v })} required />
          <FormInput icon={Shirt} label="Material type" value={form.materialType} onChange={(v) => setForm({ ...form, materialType: v })} required />
          <FormSelect icon={Recycle} label="Source" value={form.sourceType} onChange={(v) => setForm({ ...form, sourceType: v as InventorySourceType })}>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FormSelect>
          <FormInput icon={Scale} label="Quantity" type="number" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} required />
          <FormSelect icon={Ruler} label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v as InventoryUnit })}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </FormSelect>
          <FormInput icon={FileText} label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <div className="flex items-center gap-3 sm:col-span-3">
            <Button type="submit">Save item</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          {error && (
            <div className="sm:col-span-3">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}
        </form>
      </Modal>

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Code</th>
            <th className={tableCellClass}>Material</th>
            <th className={tableCellClass}>Source</th>
            <th className={tableCellClass}>Qty</th>
            <th className={tableCellClass}>Status</th>
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
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Recycle} title="No inventory logged yet" description="Log incoming materials as they arrive." />
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{item.itemCode}</td>
                <td className={`${tableCellClass} text-patch-ink`}>{item.materialType}</td>
                <td className={`${tableCellClass} capitalize text-patch-ink-muted`}>{item.sourceType}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{item.quantity} {item.unit}</td>
                <td className={tableCellClass}>
                  <StatusPillSelect
                    value={item.status}
                    tone={STATUS_TONE[item.status]}
                    options={STATUSES}
                    onChange={(v) => updateStatus(item._id, v as InventoryItem["status"])}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
