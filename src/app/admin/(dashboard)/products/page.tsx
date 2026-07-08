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
import { formatPrice } from "@/lib/utils";
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
import type { ApiListResponse, Category, Product, ProductCategory, ProductStatus } from "@/types";

const STATUSES: ProductStatus[] = ["available", "reserved", "sold", "archived"];

const STATUS_TONE: Record<ProductStatus, Tone> = {
  available: "green",
  reserved: "rust",
  sold: "teal",
  archived: "neutral",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    slug: "",
    description: "",
    story: "",
    images: [] as string[],
    price: "",
    category: "" as ProductCategory,
    materials: "",
    size: "One Size",
    batchLabel: "1-of-1",
  });

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

  const emptyForm = {
    sku: "", name: "", slug: "", description: "", story: "", images: [] as string[],
    price: "", category: categories[0]?.slug ?? "", materials: "", size: "One Size", batchLabel: "1-of-1",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      price: Number(form.price),
      materials: form.materials.split(",").map((s) => s.trim()).filter(Boolean),
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
      size: p.size,
      batchLabel: p.batchLabel,
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
        description="Manage every one-of-a-kind piece listed in the shop."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            New product
          </Button>
        }
      />

      <Modal
        open={showForm}
        onClose={cancelForm}
        icon={Package}
        title={editingId ? "Editing product" : "New product"}
        description={editingId ? `Updating ${form.name || form.sku}` : "Add a one-of-a-kind piece to the shop"}
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
            <FormInput icon={Layers} label="Batch label" value={form.batchLabel} onChange={(v) => setForm({ ...form, batchLabel: v })} />
            <FormInput icon={Ruler} label="Size" value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
            <FormInput icon={Shirt} label="Materials (comma separated)" value={form.materials} onChange={(v) => setForm({ ...form, materials: v })} />
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
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={5}>
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
                    </div>
                  </div>
                </td>
                <td className={`${tableCellClass} capitalize text-patch-ink-muted`}>{p.category}</td>
                <td className={`${tableCellClass} whitespace-nowrap text-patch-ink`}>{formatPrice(p.price, p.currency)}</td>
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
