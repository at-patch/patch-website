"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Home, Plus, Settings2, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSelect,
  FormTextarea,
  IconButton,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, ApiResponse, HomepageSettings, ProductBatch } from "@/types";

type ProductBatchOption = Omit<ProductBatch, "products"> & { products: ProductBatch["products"] };

type HomepageRow = {
  batch: ProductBatchOption;
  enabled: boolean;
  order: number;
};

const DEFAULT_PROMO = {
  eyebrow: "",
  title: "",
  body: "",
  ctaLabel: "",
  ctaHref: "",
};

function isBatch(value: HomepageSettings["productBatches"][number]["batch"]): value is ProductBatchOption {
  return Boolean(value && typeof value === "object" && "_id" in value);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next.map((row, rowIndex) => ({ ...row, order: rowIndex }));
}

export default function HomepageSettingsPage() {
  const [batches, setBatches] = useState<ProductBatchOption[]>([]);
  const [rows, setRows] = useState<HomepageRow[]>([]);
  const [primaryPromo, setPrimaryPromo] = useState(DEFAULT_PROMO);
  const [secondaryPromo, setSecondaryPromo] = useState(DEFAULT_PROMO);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(rows.map((row) => row.batch._id)), [rows]);
  const availableBatches = batches.filter((batch) => batch.active && !selectedIds.has(batch._id));

  const load = async () => {
    setLoading(true);
    const [{ data: settingsResponse }, { data: batchesResponse }] = await Promise.all([
      axiosInstance.get<ApiResponse<HomepageSettings>>("/admin/homepage-settings"),
      axiosInstance.get<ApiListResponse<ProductBatchOption>>("/admin/product-batches"),
    ]);

    const nextRows = (settingsResponse.data.productBatches ?? [])
      .filter((row): row is HomepageSettings["productBatches"][number] & { batch: ProductBatchOption } => isBatch(row.batch))
      .sort((a, b) => a.order - b.order)
      .map((row, index) => ({
        batch: row.batch,
        enabled: row.enabled,
        order: index,
      }));

    setRows(nextRows);
    setPrimaryPromo(settingsResponse.data.primaryPromo ?? {
      eyebrow: "New Drop",
      title: "Color-blocked, cut for confidence.",
      body: "Bold silhouettes and statement color, styled for how you actually move through your day.",
      ctaLabel: "Shop Now",
      ctaHref: "/shop",
    });
    setSecondaryPromo(settingsResponse.data.secondaryPromo ?? {
      eyebrow: "Made in Dhaka",
      title: "Every stitch, done by hand.",
      body: "Small studio team, careful finishing, a little less waste along the way — fashion that's made thoughtfully.",
      ctaLabel: "See the Process",
      ctaHref: "/story",
    });
    setBatches(batchesResponse.data);
    setSelectedBatchId(batchesResponse.data.find((batch) => batch.active && !nextRows.some((row) => row.batch._id === batch._id))?._id ?? "");
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
  }, []);

  const addBatch = () => {
    const batch = batches.find((item) => item._id === selectedBatchId);
    if (!batch || selectedIds.has(batch._id)) return;
    setRows((current) => [...current, { batch, enabled: true, order: current.length }]);
    setSelectedBatchId("");
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        primaryPromo,
        secondaryPromo,
        productBatches: rows.map((row, index) => ({
          batch: row.batch._id,
          enabled: row.enabled,
          order: index,
        })),
      };
      const { data } = await axiosInstance.put<ApiResponse<HomepageSettings>>("/admin/homepage-settings", payload);
      const savedRows = (data.data.productBatches ?? [])
        .filter((row): row is HomepageSettings["productBatches"][number] & { batch: ProductBatchOption } => isBatch(row.batch))
        .sort((a, b) => a.order - b.order)
        .map((row, index) => ({ batch: row.batch, enabled: row.enabled, order: index }));
      setRows(savedRows);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save homepage settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Settings2}
        title="Homepage Settings"
        description="Edit homepage promo copy and choose which active product batches appear as carousel sections."
        action={<Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-patch-line bg-patch-bg p-4">
          <p className="mb-4 text-sm font-semibold text-patch-ink">Primary promo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Eyebrow" value={primaryPromo.eyebrow} onChange={(v) => setPrimaryPromo({ ...primaryPromo, eyebrow: v })} required />
            <FormInput label="CTA label" value={primaryPromo.ctaLabel} onChange={(v) => setPrimaryPromo({ ...primaryPromo, ctaLabel: v })} required />
            <div className="sm:col-span-2">
              <FormInput label="Title" value={primaryPromo.title} onChange={(v) => setPrimaryPromo({ ...primaryPromo, title: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormTextarea label="Body" value={primaryPromo.body} onChange={(v) => setPrimaryPromo({ ...primaryPromo, body: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormInput label="CTA URL" value={primaryPromo.ctaHref} onChange={(v) => setPrimaryPromo({ ...primaryPromo, ctaHref: v })} required />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-patch-line bg-patch-bg p-4">
          <p className="mb-4 text-sm font-semibold text-patch-ink">Secondary promo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Eyebrow" value={secondaryPromo.eyebrow} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, eyebrow: v })} required />
            <FormInput label="CTA label" value={secondaryPromo.ctaLabel} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, ctaLabel: v })} required />
            <div className="sm:col-span-2">
              <FormInput label="Title" value={secondaryPromo.title} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, title: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormTextarea label="Body" value={secondaryPromo.body} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, body: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormInput label="CTA URL" value={secondaryPromo.ctaHref} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, ctaHref: v })} required />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-patch-line bg-patch-bg p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormSelect label="Active product batch" value={selectedBatchId} onChange={setSelectedBatchId} icon={Home}>
            <option value="">Select a batch</option>
            {availableBatches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.title}
              </option>
            ))}
          </FormSelect>
        </div>
        <Button type="button" icon={Plus} onClick={addBatch} disabled={!selectedBatchId}>
          Add to homepage
        </Button>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Order</th>
            <th className={tableCellClass}>Batch</th>
            <th className={tableCellClass}>Products</th>
            <th className={tableCellClass}>Display</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5} className="p-6">
                <div className="h-24 animate-pulse rounded-lg bg-patch-ink/5" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Settings2} title="No homepage batches selected" description="Add active batches to publish product carousel sections." />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.batch._id} className={tableRowClass}>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{index + 1}</td>
                <td className={tableCellClass}>
                  <p className="text-base font-medium text-patch-ink">{row.batch.title}</p>
                  {row.batch.description && <p className="mt-1 max-w-xl text-sm text-patch-ink-muted">{row.batch.description}</p>}
                  {!row.batch.active && <p className="mt-1 text-xs text-red-600">Inactive batches are skipped on the storefront.</p>}
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{row.batch.products.length} products</td>
                <td className={tableCellClass}>
                  <Badge tone={row.enabled ? "green" : "neutral"}>{row.enabled ? "Enabled" : "Disabled"}</Badge>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={ArrowUp} label="Move up" onClick={() => setRows(moveItem(rows, index, -1))} disabled={index === 0} />
                    <IconButton icon={ArrowDown} label="Move down" onClick={() => setRows(moveItem(rows, index, 1))} disabled={index === rows.length - 1} />
                    <IconButton
                      icon={row.enabled ? EyeOff : Eye}
                      label={row.enabled ? "Disable" : "Enable"}
                      onClick={() => setRows(rows.map((item) => item.batch._id === row.batch._id ? { ...item, enabled: !item.enabled } : item))}
                    />
                    <IconButton icon={Trash2} label="Remove" tone="danger" onClick={() => setRows(rows.filter((item) => item.batch._id !== row.batch._id).map((item, itemIndex) => ({ ...item, order: itemIndex })))} />
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
