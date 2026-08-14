"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, FileText, Hash, ImageIcon, Pencil, Plus, Recycle, Ruler, Scissors, Shirt, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  FormInput,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableActionsCellClass,
  tableActionsHeadClass,
  tableCellCompact,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import { TagCell, TagPicker } from "@/components/admin/TagPicker";
import { DetailModal, DetailSection, orDash } from "@/components/admin/DetailModal";
import { inventoryToTagOption, productToTagOption, type TagOption } from "@/lib/tag-options";
import type { ApiListResponse, InventoryItem, Pattern, Product } from "@/types";

const EMPTY_FORM = {
  patternImage: "",
  fabricCode: "",
  sampleCode: "",
  fabAmount1: "",
  fabricAmount2: "",
  size1: "",
  size2: "",
  productTags: [] as string[],
  inventoryTags: [] as string[],
};

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [productOptions, setProductOptions] = useState<TagOption[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<TagOption[]>([]);
  const [tagOptionsLoading, setTagOptionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Pattern | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Pattern>>("/admin/patterns");
    setPatterns(data.data);
    setLoading(false);
  };

  // Both tag vocabularies back the pickers and the names shown in the table.
  // Tags are stored as ids only, so without these the table could print only ObjectIds.
  const loadTagOptions = async () => {
    setTagOptionsLoading(true);
    try {
      const [products, inventory] = await Promise.all([
        axiosInstance.get<ApiListResponse<Product>>("/admin/products?limit=200"),
        axiosInstance.get<ApiListResponse<InventoryItem>>("/admin/inventory"),
      ]);
      setProductOptions(products.data.data.map(productToTagOption));
      setInventoryOptions(inventory.data.data.map(inventoryToTagOption));
    } finally {
      setTagOptionsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
    loadTagOptions();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (pattern: Pattern) => {
    setForm({
      patternImage: pattern.patternImage,
      fabricCode: pattern.fabricCode,
      sampleCode: pattern.sampleCode ?? "",
      fabAmount1: pattern.fabAmount1,
      fabricAmount2: pattern.fabricAmount2,
      size1: String(pattern.size1),
      size2: String(pattern.size2),
      productTags: pattern.productTags ?? [],
      inventoryTags: pattern.inventoryTags ?? [],
    });
    setEditingId(pattern._id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      size1: Number(form.size1),
      size2: Number(form.size2),
    };
    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/patterns/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/patterns", payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add pattern.");
    }
  };

  const removePattern = async (id: string) => {
    await axiosInstance.delete(`/admin/patterns/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Scissors}
        title="Patterns"
        description="Track internal pattern inventory for raw-material planning."
        action={
          <div className="flex flex-wrap gap-2">
            {patterns.length === 0 && (
              <Button variant="outline" icon={Scissors} onClick={async () => { await axiosInstance.put("/admin/patterns"); load(); }}>
                Add starter records
              </Button>
            )}
            <Button icon={Plus} onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}>
              Add pattern
            </Button>
          </div>
        }
      />

      <Modal open={showForm} onClose={resetForm} icon={Scissors} title={editingId ? "Edit pattern" : "New pattern"} description="Manage a pattern tracking record">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <ImageUploader
              images={form.patternImage ? [form.patternImage] : []}
              onChange={(images) => setForm({ ...form, patternImage: images[0] ?? "" })}
              label="Pattern image"
              uploadFolder="products"
              multiple={false}
            />
          </div>
          <FormInput icon={Hash} label="Fabric code" value={form.fabricCode} onChange={(v) => setForm({ ...form, fabricCode: v })} required />
          <FormInput icon={FileText} label="Sample code" value={form.sampleCode} onChange={(v) => setForm({ ...form, sampleCode: v })} />
          <FormInput icon={Hash} label="Fab-Amount 1" value={form.fabAmount1} onChange={(v) => setForm({ ...form, fabAmount1: v })} required />
          <FormInput icon={Hash} label="Fabric Amount 2" value={form.fabricAmount2} onChange={(v) => setForm({ ...form, fabricAmount2: v })} required />
          <FormInput icon={Ruler} label="Size 1" type="number" value={form.size1} onChange={(v) => setForm({ ...form, size1: v })} required />
          <FormInput icon={Ruler} label="Size 2" type="number" value={form.size2} onChange={(v) => setForm({ ...form, size2: v })} required />
          <div className="grid gap-5 border-t border-patch-line pt-5 sm:col-span-3 sm:grid-cols-2">
            <TagPicker
              label="Products made from this pattern"
              icon={Shirt}
              options={productOptions}
              value={form.productTags}
              loading={tagOptionsLoading}
              placeholder="Search products by name or SKU"
              emptyText="No products to tag yet."
              onChange={(productTags) => setForm({ ...form, productTags })}
            />
            <TagPicker
              label="Raw materials this pattern uses"
              icon={Recycle}
              options={inventoryOptions}
              value={form.inventoryTags}
              loading={tagOptionsLoading}
              placeholder="Search inventory by item or fabric code"
              emptyText="No inventory items to tag yet."
              onChange={(inventoryTags) => setForm({ ...form, inventoryTags })}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-3">
            <Button type="submit">Save pattern</Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
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

      <DetailModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        icon={Scissors}
        title={viewing?.patternCode ?? ""}
        subtitle="Pattern record"
        images={viewing?.patternImage ? [viewing.patternImage] : []}
        fields={
          viewing
            ? [
                { label: "Pattern code", value: viewing.patternCode },
                { label: "Fabric code", value: orDash(viewing.fabricCode) },
                { label: "Sample code", value: orDash(viewing.sampleCode) },
                { label: "Fab-Amount 1", value: orDash(viewing.fabAmount1) },
                { label: "Fabric Amount 2", value: orDash(viewing.fabricAmount2) },
                { label: "Size 1", value: viewing.size1 },
                { label: "Size 2", value: viewing.size2 },
                { label: "Added", value: new Date(viewing.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Last updated", value: new Date(viewing.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) },
              ]
            : []
        }
        footer={
          viewing && (
            <Button
              type="button"
              icon={Pencil}
              onClick={() => {
                const pattern = viewing;
                setViewing(null);
                openEdit(pattern);
              }}
            >
              Edit pattern
            </Button>
          )
        }
      >
        {viewing && (
          <>
            <DetailSection title="Products made from this pattern">
              <TagCell ids={viewing.productTags ?? []} options={productOptions} />
            </DetailSection>
            <DetailSection title="Raw materials this pattern uses">
              <TagCell ids={viewing.inventoryTags ?? []} options={inventoryOptions} tone="teal" />
            </DetailSection>
          </>
        )}
      </DetailModal>

      <div className="hidden sm:block">
      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Pattern</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Fabric code</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Sample</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Fabric amounts</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Sizes</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Products</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Materials</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass} ${tableActionsHeadClass} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={8}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : patterns.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState icon={Scissors} title="No patterns yet" description="Add pattern records when the team starts tracking them." />
              </td>
            </tr>
          ) : (
            patterns.map((pattern) => (
              <tr key={pattern._id} className={tableRowClass}>
                <td className={tableCellCompact}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                      {pattern.patternImage ? (
                        <Image src={pattern.patternImage} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <ImageIcon size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-patch-ink-muted" />
                      )}
                    </div>
                    <span className="whitespace-nowrap font-medium text-patch-ink">{pattern.patternCode}</span>
                  </div>
                </td>
                <td className={tableCellCompact}>
                  <span className="block max-w-[13rem] truncate text-patch-ink" title={pattern.fabricCode}>
                    {pattern.fabricCode}
                  </span>
                </td>
                <td className={`${tableCellCompact} whitespace-nowrap text-patch-ink-muted`}>
                  {pattern.sampleCode || "—"}
                </td>
                <td className={`${tableCellCompact} whitespace-nowrap text-patch-ink-muted`}>
                  <span className="text-patch-ink">{pattern.fabAmount1}</span>
                  <span className="mx-1.5 text-patch-ink-muted/50">/</span>
                  {pattern.fabricAmount2}
                </td>
                <td className={`${tableCellCompact} whitespace-nowrap text-patch-ink-muted`}>
                  {pattern.size1}
                  <span className="mx-1.5 text-patch-ink-muted/50">/</span>
                  {pattern.size2}
                </td>
                <td className={tableCellCompact}>
                  <TagCell ids={pattern.productTags ?? []} options={productOptions} />
                </td>
                <td className={tableCellCompact}>
                  <TagCell ids={pattern.inventoryTags ?? []} options={inventoryOptions} tone="teal" />
                </td>
                <td className={`${tableCellCompact} ${tableActionsCellClass}`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={Eye} label={`View ${pattern.patternCode}`} onClick={() => setViewing(pattern)} />
                    <IconButton icon={Pencil} label={`Edit ${pattern.patternCode}`} onClick={() => openEdit(pattern)} />
                    <IconButton icon={Trash2} label={`Delete ${pattern.patternCode}`} tone="danger" onClick={() => removePattern(pattern._id)} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
      </div>

      {/* Mobile: stacked cards. An eight-column reference table cannot be read on a phone. */}
      <div className="mt-6 space-y-3 sm:hidden">
        {loading ? (
          [0, 1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="h-4 w-24 rounded bg-patch-ink/5" />
              <div className="mt-3 h-4 w-40 rounded bg-patch-ink/5" />
              <div className="mt-3 h-8 w-full rounded bg-patch-ink/5" />
            </Card>
          ))
        ) : patterns.length === 0 ? (
          <Card>
            <EmptyState icon={Scissors} title="No patterns yet" description="Add pattern records when the team starts tracking them." />
          </Card>
        ) : (
          patterns.map((pattern) => (
            <Card key={pattern._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                  {pattern.patternImage ? (
                    <Image src={pattern.patternImage} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <ImageIcon size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-patch-ink-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-patch-ink">{pattern.patternCode}</p>
                  <p className="truncate text-xs text-patch-ink-muted">{pattern.fabricCode}</p>
                  {pattern.sampleCode && (
                    <p className="truncate text-xs text-patch-ink-muted">Sample {pattern.sampleCode}</p>
                  )}
                </div>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-patch-line pt-3 text-xs">
                <div>
                  <dt className="text-patch-ink-muted">Fabric amounts</dt>
                  <dd className="mt-0.5 text-patch-ink">{pattern.fabAmount1} / {pattern.fabricAmount2}</dd>
                </div>
                <div>
                  <dt className="text-patch-ink-muted">Sizes</dt>
                  <dd className="mt-0.5 text-patch-ink">{pattern.size1} / {pattern.size2}</dd>
                </div>
              </dl>

              {((pattern.productTags?.length ?? 0) > 0 || (pattern.inventoryTags?.length ?? 0) > 0) && (
                <div className="mt-3 space-y-2 border-t border-patch-line pt-3">
                  {(pattern.productTags?.length ?? 0) > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs text-patch-ink-muted">Products</p>
                      <TagCell ids={pattern.productTags ?? []} options={productOptions} />
                    </div>
                  )}
                  {(pattern.inventoryTags?.length ?? 0) > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs text-patch-ink-muted">Materials</p>
                      <TagCell ids={pattern.inventoryTags ?? []} options={inventoryOptions} tone="teal" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex justify-end gap-1 border-t border-patch-line pt-3">
                <IconButton icon={Eye} label={`View ${pattern.patternCode}`} onClick={() => setViewing(pattern)} />
                <IconButton icon={Pencil} label={`Edit ${pattern.patternCode}`} onClick={() => openEdit(pattern)} />
                <IconButton icon={Trash2} label={`Delete ${pattern.patternCode}`} tone="danger" onClick={() => removePattern(pattern._id)} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
