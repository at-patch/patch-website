"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, FileText, Hash, ImageIcon, Pencil, Plus, Recycle, Ruler, Shirt, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormTextarea,
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
import { ImageUploader } from "@/components/admin/ImageUploader";
import { TagCell, TagPicker } from "@/components/admin/TagPicker";
import { DetailModal, DetailSection, orDash } from "@/components/admin/DetailModal";
import { productToTagOption, type TagOption } from "@/lib/tag-options";
import type { ApiListResponse, InventoryItem, Product } from "@/types";

const EMPTY_FORM = {
  image: "",
  fabricCode: "",
  category: "",
  heightInches: "",
  widthInches: "",
  quantityPcs: "",
  description: "",
  productTags: [] as string[],
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [productOptions, setProductOptions] = useState<TagOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<InventoryItem | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<InventoryItem>>("/admin/inventory");
    setItems(data.data);
    setLoading(false);
  };

  // The product list backs both the tag picker and the names shown in the table.
  // Tags are stored as ids only, so without this the table could only print ObjectIds.
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data } = await axiosInstance.get<ApiListResponse<Product>>("/admin/products?limit=200");
      setProductOptions(data.data.map(productToTagOption));
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
    loadProducts();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      image: item.image,
      fabricCode: item.fabricCode,
      category: item.category,
      heightInches: String(item.heightInches),
      widthInches: String(item.widthInches),
      quantityPcs: String(item.quantityPcs),
      description: item.description ?? "",
      productTags: item.productTags ?? [],
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      heightInches: Number(form.heightInches),
      widthInches: Number(form.widthInches),
      quantityPcs: Number(form.quantityPcs),
    };
    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/inventory/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/inventory", payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add item.");
    }
  };

  const removeItem = async (id: string) => {
    await axiosInstance.delete(`/admin/inventory/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Recycle}
        title="Inventory"
        description="Track internal raw-material inventory by fabric code, dimensions, and piece count."
        action={
          <div className="flex flex-wrap gap-2">
            {items.length === 0 && (
              <Button variant="outline" icon={Recycle} onClick={async () => { await axiosInstance.put("/admin/inventory"); load(); }}>
                Add starter records
              </Button>
            )}
            <Button icon={Plus} onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}>
              Add inventory
            </Button>
          </div>
        }
      />

      <Modal open={showForm} onClose={resetForm} icon={Recycle} title={editingId ? "Edit inventory item" : "New inventory item"} description="Manage one raw-material tracking item">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <ImageUploader
              images={form.image ? [form.image] : []}
              onChange={(images) => setForm({ ...form, image: images[0] ?? "" })}
              label="Image upload"
              uploadFolder="products"
              multiple={false}
            />
          </div>
          <FormInput icon={Hash} label="Fabric code" value={form.fabricCode} onChange={(v) => setForm({ ...form, fabricCode: v })} required />
          <FormInput icon={FileText} label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} required />
          <FormInput icon={Ruler} label="Height (inches)" type="number" value={form.heightInches} onChange={(v) => setForm({ ...form, heightInches: v })} required />
          <FormInput icon={Ruler} label="Width (inches)" type="number" value={form.widthInches} onChange={(v) => setForm({ ...form, widthInches: v })} required />
          <FormInput icon={Hash} label="Quantity (pcs)" type="number" value={form.quantityPcs} onChange={(v) => setForm({ ...form, quantityPcs: v })} required />
          <div className="sm:col-span-3">
            <FormTextarea icon={FileText} label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
          <div className="border-t border-patch-line pt-5 sm:col-span-3">
            <TagPicker
              label="Products made from this material"
              icon={Shirt}
              options={productOptions}
              value={form.productTags}
              loading={productsLoading}
              placeholder="Search products by name or SKU"
              emptyText="No products to tag yet."
              onChange={(productTags) => setForm({ ...form, productTags })}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-3">
            <Button type="submit">Save item</Button>
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
        icon={Recycle}
        title={viewing?.itemCode ?? ""}
        subtitle="Raw-material inventory item"
        images={viewing?.image ? [viewing.image] : []}
        fields={
          viewing
            ? [
                { label: "Item code", value: viewing.itemCode },
                { label: "Fabric code", value: orDash(viewing.fabricCode) },
                { label: "Category", value: orDash(viewing.category) },
                { label: "Quantity", value: `${viewing.quantityPcs} pcs` },
                { label: "Height", value: `${viewing.heightInches} in` },
                { label: "Width", value: `${viewing.widthInches} in` },
                { label: "Added", value: new Date(viewing.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Last updated", value: new Date(viewing.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Description", value: orDash(viewing.description), wide: true },
              ]
            : []
        }
        footer={
          viewing && (
            <Button
              type="button"
              icon={Pencil}
              onClick={() => {
                const item = viewing;
                setViewing(null);
                openEdit(item);
              }}
            >
              Edit item
            </Button>
          )
        }
      >
        {viewing && (
          <DetailSection title="Products made from this material">
            <TagCell ids={viewing.productTags ?? []} options={productOptions} />
          </DetailSection>
        )}
      </DetailModal>

      <div className="hidden sm:block">
      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Item</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Fabric code</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Category</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Size (H×W)</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Qty</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Description</th>
            <th className={`${tableCellCompact} ${tableHeadCellClass}`}>Products</th>
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
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState icon={Recycle} title="No inventory items yet" description="Add raw-material items when they arrive." />
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item._id} className={tableRowClass}>
                <td className={tableCellCompact}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <ImageIcon size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-patch-ink-muted" />
                      )}
                    </div>
                    <span className="whitespace-nowrap font-medium text-patch-ink">{item.itemCode}</span>
                  </div>
                </td>
                <td className={tableCellCompact}>
                  <span className="block max-w-[11rem] truncate text-patch-ink" title={item.fabricCode}>
                    {item.fabricCode}
                  </span>
                </td>
                <td className={`${tableCellCompact} whitespace-nowrap text-patch-ink-muted`}>{item.category || "—"}</td>
                <td className={`${tableCellCompact} whitespace-nowrap text-patch-ink-muted`}>
                  {item.heightInches}
                  <span className="mx-1 text-patch-ink-muted/50">×</span>
                  {item.widthInches}
                  <span className="ml-1 text-xs text-patch-ink-muted/70">in</span>
                </td>
                <td className={`${tableCellCompact} whitespace-nowrap font-semibold text-patch-ink`}>{item.quantityPcs}</td>
                <td className={tableCellCompact}>
                  <span className="block max-w-[14rem] truncate text-patch-ink-muted" title={item.description || undefined}>
                    {item.description || "—"}
                  </span>
                </td>
                <td className={tableCellCompact}>
                  <TagCell ids={item.productTags ?? []} options={productOptions} />
                </td>
                <td className={`${tableCellCompact} ${tableActionsCellClass}`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={Eye} label={`View ${item.itemCode}`} onClick={() => setViewing(item)} />
                    <IconButton icon={Pencil} label={`Edit ${item.itemCode}`} onClick={() => openEdit(item)} />
                    <IconButton icon={Trash2} label={`Delete ${item.itemCode}`} tone="danger" onClick={() => removeItem(item._id)} />
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
        ) : items.length === 0 ? (
          <Card>
            <EmptyState icon={Recycle} title="No inventory items yet" description="Add raw-material items when they arrive." />
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <ImageIcon size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-patch-ink-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-patch-ink">{item.itemCode}</p>
                  <p className="truncate text-xs text-patch-ink-muted">
                    {item.fabricCode}
                    {item.category ? ` · ${item.category}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-patch-ink">{item.quantityPcs} pcs</span>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-patch-line pt-3 text-xs">
                <div>
                  <dt className="text-patch-ink-muted">Size</dt>
                  <dd className="mt-0.5 text-patch-ink">{item.heightInches} × {item.widthInches} in</dd>
                </div>
                {item.description && (
                  <div className="min-w-0 flex-1">
                    <dt className="text-patch-ink-muted">Description</dt>
                    <dd className="mt-0.5 truncate text-patch-ink">{item.description}</dd>
                  </div>
                )}
              </dl>

              {(item.productTags?.length ?? 0) > 0 && (
                <div className="mt-3 border-t border-patch-line pt-3">
                  <p className="mb-1.5 text-xs text-patch-ink-muted">Products</p>
                  <TagCell ids={item.productTags ?? []} options={productOptions} />
                </div>
              )}

              <div className="mt-3 flex justify-end gap-1 border-t border-patch-line pt-3">
                <IconButton icon={Eye} label={`View ${item.itemCode}`} onClick={() => setViewing(item)} />
                <IconButton icon={Pencil} label={`Edit ${item.itemCode}`} onClick={() => openEdit(item)} />
                <IconButton icon={Trash2} label={`Delete ${item.itemCode}`} tone="danger" onClick={() => removeItem(item._id)} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
