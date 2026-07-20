"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Hash,
  ImageOff,
  Layers,
  Link2,
  Package,
  Pencil,
  Plus,
  Ruler,
  Shirt,
  Tags,
  Trash2,
  Type,
  Wallet,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { SIZES } from "@/lib/constants";
import { formatPrice, getTotalQuantity } from "@/lib/utils";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSection,
  FormSelect,
  FormTextarea,
  IconButton,
  Modal,
  PageHeader,
  StatusPillSelect,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
  type Tone,
} from "@/components/admin/ui";
import type {
  ApiListResponse,
  Category,
  Product,
  ProductCategory,
  ProductRarity,
  ProductStatus,
} from "@/types";

const STATUSES: ProductStatus[] = ["available", "reserved", "sold", "archived"];

const STATUS_TONE: Record<ProductStatus, Tone> = {
  available: "green",
  reserved: "rust",
  sold: "teal",
  archived: "neutral",
};

type VariantDraft = {
  size: string;
  color: string;
  quantity: string;
};

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  images: string[];
  price: string;
  category: ProductCategory;
  materials: string;
  rarity: ProductRarity;
  size: string;
  variants: VariantDraft[];
  batchLabel: string;
};

const DEFAULT_SIZE = SIZES[3];

function createVariantDraft(): VariantDraft {
  return {
    size: DEFAULT_SIZE,
    color: "",
    quantity: "1",
  };
}

function createEmptyForm(category = ""): ProductForm {
  return {
    sku: "",
    name: "",
    slug: "",
    description: "",
    story: "",
    images: [] as string[],
    price: "",
    category,
    materials: "",
    rarity: "multi-quantity" as ProductRarity,
    size: DEFAULT_SIZE,
    variants: [createVariantDraft()],
    batchLabel: "Limited Run",
  };
}

function VariantEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}) {
  const totalQuantity = variants.reduce((sum, variant) => sum + Math.max(Number(variant.quantity) || 0, 0), 0);

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="sm:col-span-2">
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={`${index}-${variant.size}-${variant.color}`} className="grid gap-3 rounded-2xl border border-patch-line p-4 sm:grid-cols-[1fr_1.2fr_0.8fr_auto]">
            <FormSelect label="Size" value={variant.size} onChange={(value) => updateVariant(index, { size: value })} icon={Ruler}>
              {SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
            <FormInput label="Color" value={variant.color} onChange={(value) => updateVariant(index, { color: value })} icon={Shirt} required />
            <FormInput
              label="Quantity"
              type="number"
              value={variant.quantity}
              onChange={(value) => updateVariant(index, { quantity: value })}
              icon={Layers}
              required
            />
            <div className="flex items-end">
              <IconButton
                type="button"
                icon={Trash2}
                label="Remove variant"
                tone="danger"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
                className="mb-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-patch-ink-muted">Total quantity: {totalQuantity}</p>
        <Button type="button" variant="outline" onClick={() => onChange([...variants, createVariantDraft()])}>
          Add size/color
        </Button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => createEmptyForm());

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: categoryData }] = await Promise.all([
      axiosInstance.get<ApiListResponse<Product>>("/admin/products"),
      axiosInstance.get<ApiListResponse<Category>>("/admin/categories"),
    ]);
    setProducts(data.data);
    setCategories(categoryData.data);
    setForm((f) => (f.category ? f : { ...f, category: categoryData.data[0]?.slug ?? "" }));
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const emptyForm = createEmptyForm(categories[0]?.slug ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sanitizedVariants = form.variants
      .map((variant) => ({
        size: variant.size,
        color: variant.color.trim(),
        quantity: Number(variant.quantity),
      }))
      .filter((variant) => variant.color && Number.isFinite(variant.quantity) && variant.quantity >= 0);

    if (form.rarity === "multi-quantity" && sanitizedVariants.length === 0) {
      setError("Add at least one size/color variant with stock.");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      materials: form.materials.split(",").map((s) => s.trim()).filter(Boolean),
      size: form.rarity === "one-of-one" ? form.size : sanitizedVariants[0]?.size ?? DEFAULT_SIZE,
      variants: form.rarity === "multi-quantity" ? sanitizedVariants : [],
      batchLabel: form.batchLabel.trim() || (form.rarity === "one-of-one" ? "1-of-1" : "Limited Run"),
    };

    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/products/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/products", payload);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save product.");
    }
  };

  const startEdit = (p: Product) => {
    const rarity = p.rarity === "multi-quantity" ? "multi-quantity" : "one-of-one";
    setEditingId(p._id);
    setForm({
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      description: p.description,
      story: p.story ?? "",
      images: p.images ?? [],
      price: String(p.price),
      category: p.category,
      materials: (p.materials ?? []).join(", "),
      rarity,
      size: p.size || DEFAULT_SIZE,
      batchLabel: p.batchLabel || (rarity === "one-of-one" ? "1-of-1" : "Limited Run"),
      variants:
        rarity === "multi-quantity" && p.variants.length > 0
          ? p.variants.map((variant) => ({
              size: variant.size,
              color: variant.color,
              quantity: String(variant.quantity),
            }))
          : [createVariantDraft()],
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const updateStatus = async (id: string, status: ProductStatus) => {
    await axiosInstance.patch(`/admin/products/${id}`, { status });
    load();
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await axiosInstance.delete(`/admin/products/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Package}
        title="Products / SKUs"
        description="Manage one-of-one pieces and multi-quantity variants listed in the shop."
        action={
          <Button icon={Plus} onClick={() => {
            setEditingId(null);
            setForm(createEmptyForm(categories[0]?.slug ?? ""));
            setError(null);
            setShowForm(true);
          }}>
            New product
          </Button>
        }
      />

      <Modal
        open={showForm}
        onClose={cancelForm}
        icon={Package}
        title={editingId ? "Editing product" : "New product"}
        description={editingId ? `Updating ${form.name || form.sku}` : "Add a one-of-one or multi-quantity product to the shop"}
      >
        <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <FormSection title="Identity">
            <FormInput icon={Hash} label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
            <FormInput icon={Type} label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <FormInput icon={Link2} label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
            <FormSelect icon={Tags} label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v as ProductCategory })}>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>{c.name}</option>
              ))}
            </FormSelect>
          </FormSection>

          <FormSection title="Pricing & details">
            <FormInput icon={Wallet} label="Price (BDT)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
            <FormSelect icon={Package} label="Product rarity" value={form.rarity} onChange={(v) => setForm({ ...form, rarity: v as ProductRarity })}>
              <option value="multi-quantity">Multiple quantity</option>
              <option value="one-of-one">One of a kind (1-of-1)</option>
            </FormSelect>
            <FormInput icon={Tags} label="Batch label" value={form.batchLabel} onChange={(v) => setForm({ ...form, batchLabel: v })} placeholder="Limited Run" />
            <FormInput icon={Shirt} label="Materials (comma separated)" value={form.materials} onChange={(v) => setForm({ ...form, materials: v })} />
          </FormSection>

          <FormSection title="Stock">
            {form.rarity === "one-of-one" ? (
              <FormSelect icon={Ruler} label="Size" value={form.size} onChange={(v) => setForm({ ...form, size: v })}>
                {SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FormSelect>
            ) : (
              <VariantEditor variants={form.variants} onChange={(variants) => setForm({ ...form, variants })} />
            )}
          </FormSection>

          <FormSection title="Media">
            <div className="sm:col-span-2">
              <ImageUploader images={form.images} onChange={(images) => setForm({ ...form, images })} />
            </div>
          </FormSection>

          <FormSection title="Content">
            <div className="sm:col-span-2">
              <FormTextarea
                icon={FileText}
                label="Description"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                rows={3}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FormTextarea icon={BookOpen} label="Story (optional)" value={form.story} onChange={(v) => setForm({ ...form, story: v })} rows={2} />
            </div>
          </FormSection>

          <div className="flex items-center gap-3 border-t border-patch-line pt-5 sm:col-span-2">
            <Button type="submit">{editingId ? "Update product" : "Save product"}</Button>
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
            <th className={tableCellClass}>Product</th>
            <th className={tableCellClass}>Category</th>
            <th className={tableCellClass}>Price</th>
            <th className={tableCellClass}>Stock</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={6}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState icon={Package} title="No products yet" description="Add your first SKU to start selling." />
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-4">
                    {p.images?.[0] ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-patch-line">
                        <Image src={p.images[0]} alt={p.name} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-patch-line text-patch-ink-muted/60">
                        <ImageOff size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-patch-ink">{p.name}</p>
                      <p className="mt-1 truncate font-mono text-sm text-patch-ink-muted">
                        {p.sku} · {p.slug}
                      </p>
                      <p className="mt-1 text-xs text-patch-ink-muted">
                        {p.rarity === "multi-quantity" ? "Multi-quantity" : "1-of-1"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`${tableCellClass} capitalize text-patch-ink-muted`}>{p.category}</td>
                <td className={`${tableCellClass} whitespace-nowrap text-patch-ink`}>{formatPrice(p.price, p.currency)}</td>
                <td className={`${tableCellClass} whitespace-nowrap text-patch-ink-muted`}>
                  {p.rarity === "multi-quantity" ? `${getTotalQuantity(p)} in stock` : "1-of-1"}
                </td>
                <td className={tableCellClass}>
                  <StatusPillSelect
                    value={p.status}
                    tone={STATUS_TONE[p.status]}
                    options={STATUSES}
                    onChange={(v) => updateStatus(p._id, v as ProductStatus)}
                  />
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <a
                      href={`/shop/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View in shop"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-patch-ink-muted transition hover:bg-patch-ink/5 hover:text-patch-ink"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <IconButton icon={Pencil} label="Edit product" onClick={() => startEdit(p)} />
                    <IconButton icon={Trash2} label="Delete product" tone="danger" onClick={() => deleteProduct(p._id, p.name)} />
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
