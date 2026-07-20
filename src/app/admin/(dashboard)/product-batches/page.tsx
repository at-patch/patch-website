"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  ImageOff,
  Layers,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSection,
  FormTextarea,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Product, ProductBatch } from "@/types";

type ProductBatchWithProducts = Omit<ProductBatch, "products"> & { products: Product[] };

type BatchForm = {
  title: string;
  description: string;
  active: boolean;
  products: Product[];
};

const emptyForm: BatchForm = {
  title: "",
  description: "",
  active: true,
  products: [],
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function asProductList(products: ProductBatch["products"]): Product[] {
  return products.filter((product): product is Product => typeof product === "object" && "_id" in product);
}

export default function ProductBatchesPage() {
  const [batches, setBatches] = useState<ProductBatchWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedIds = useMemo(() => new Set(form.products.map((product) => product._id)), [form.products]);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<ProductBatchWithProducts>>("/admin/product-batches");
    setBatches(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
  }, []);

  useEffect(() => {
    const search = query.trim();
    if (!showForm || search.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axiosInstance.get<ApiListResponse<Product>>("/admin/product-batches", {
          params: { productSearch: search },
        });
        setProductResults(data.data);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, showForm]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setQuery("");
    setProductResults([]);
    setShowForm(true);
  };

  const startEdit = (batch: ProductBatchWithProducts) => {
    setEditingId(batch._id);
    setForm({
      title: batch.title,
      description: batch.description ?? "",
      active: batch.active,
      products: asProductList(batch.products),
    });
    setError(null);
    setQuery("");
    setProductResults([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const saveBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      active: form.active,
      products: form.products.map((product) => product._id),
    };

    if (!payload.title) {
      setError("Title is required.");
      return;
    }

    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/product-batches/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/product-batches", payload);
      }
      closeForm();
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save product batch.");
    }
  };

  const deleteBatch = async (batch: ProductBatchWithProducts) => {
    if (!window.confirm(`Delete "${batch.title}"? It will also be removed from homepage settings.`)) return;
    await axiosInstance.delete(`/admin/product-batches/${batch._id}`);
    load();
  };

  const addProduct = (product: Product) => {
    if (selectedIds.has(product._id)) return;
    setForm((current) => ({ ...current, products: [...current.products, product] }));
  };

  const removeProduct = (id: string) => {
    setForm((current) => ({ ...current, products: current.products.filter((product) => product._id !== id) }));
  };

  return (
    <div>
      <PageHeader
        icon={Boxes}
        title="Product Batches"
        description="Build reusable ordered product groups for storefront carousel sections."
        action={<Button icon={Plus} onClick={openNew}>New batch</Button>}
      />

      <Modal
        open={showForm}
        onClose={closeForm}
        icon={Boxes}
        title={editingId ? "Editing product batch" : "New product batch"}
        description="Choose products manually and arrange their carousel order."
      >
        <form onSubmit={saveBatch} className="grid gap-5 sm:grid-cols-2">
          <FormSection title="Details">
            <FormInput icon={Type} label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
            <label className="flex items-center gap-3 rounded-xl border border-patch-line px-3.5 py-2.5 text-sm text-patch-ink">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-patch-ink"
              />
              Active
            </label>
            <div className="sm:col-span-2">
              <FormTextarea
                label="Description (optional)"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                rows={2}
              />
            </div>
          </FormSection>

          <FormSection title="Product picker">
            <div className="sm:col-span-2">
              <FormInput icon={Search} label="Search products" value={query} onChange={setQuery} placeholder="Name, SKU, or slug" />
              <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-patch-line">
                {query.trim().length < 2 ? (
                  <p className="px-4 py-3 text-sm text-patch-ink-muted">Type at least 2 characters to search.</p>
                ) : searching ? (
                  <p className="px-4 py-3 text-sm text-patch-ink-muted">Searching...</p>
                ) : productResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-patch-ink-muted">No products found.</p>
                ) : (
                  productResults.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProduct(product)}
                      disabled={selectedIds.has(product._id)}
                      className="flex w-full items-center justify-between gap-3 border-b border-patch-line px-4 py-3 text-left text-sm last:border-b-0 hover:bg-patch-ink/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="block font-medium text-patch-ink">{product.name}</span>
                        <span className="block font-mono text-xs text-patch-ink-muted">{product.sku}</span>
                      </span>
                      <Plus size={15} className="shrink-0 text-patch-ink-muted" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="Selected products">
            <div className="sm:col-span-2">
              {form.products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-patch-line px-4 py-8 text-center text-sm text-patch-ink-muted">
                  No products selected.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.products.map((product, index) => (
                    <div key={product._id} className="flex items-center gap-3 rounded-xl border border-patch-line px-3 py-2.5">
                      <span className="w-6 text-xs font-medium text-patch-ink-muted">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-patch-ink">{product.name}</p>
                        <p className="truncate font-mono text-xs text-patch-ink-muted">{product.sku}</p>
                      </div>
                      <IconButton icon={ArrowUp} label="Move up" onClick={() => setForm({ ...form, products: moveItem(form.products, index, -1) })} disabled={index === 0} />
                      <IconButton icon={ArrowDown} label="Move down" onClick={() => setForm({ ...form, products: moveItem(form.products, index, 1) })} disabled={index === form.products.length - 1} />
                      <IconButton icon={Trash2} label="Remove product" tone="danger" onClick={() => removeProduct(product._id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormSection>

          <div className="flex items-center gap-3 border-t border-patch-line pt-5 sm:col-span-2">
            <Button type="submit">{editingId ? "Update batch" : "Save batch"}</Button>
            <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
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
            <th className={tableCellClass}>Batch</th>
            <th className={tableCellClass}>Products</th>
            <th className={tableCellClass}>Status</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={4} className="p-6">
                <div className="h-24 animate-pulse rounded-lg bg-patch-ink/5" />
              </td>
            </tr>
          ) : batches.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState icon={Boxes} title="No product batches yet" description="Create a batch to power homepage carousel sections." />
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <tr key={batch._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <p className="text-base font-medium text-patch-ink">{batch.title}</p>
                  {batch.description && <p className="mt-1 max-w-xl text-sm text-patch-ink-muted">{batch.description}</p>}
                </td>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-patch-ink-muted" />
                    <span className="text-sm text-patch-ink-muted">{batch.products.length} products</span>
                    <div className="ml-2 flex -space-x-2">
                      {batch.products.slice(0, 4).map((product) => (
                        product.images?.[0] ? (
                          <div key={product._id} className="relative h-8 w-8 overflow-hidden rounded-full border border-patch-bg bg-patch-bg">
                            <Image src={product.images[0]} alt={product.name} fill sizes="32px" className="object-cover" />
                          </div>
                        ) : (
                          <div key={product._id} className="flex h-8 w-8 items-center justify-center rounded-full border border-patch-bg bg-patch-bg-alt text-patch-ink-muted">
                            <ImageOff size={13} />
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </td>
                <td className={tableCellClass}>
                  <Badge tone={batch.active ? "green" : "neutral"}>{batch.active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={ToggleLeft} label={batch.active ? "Deactivate" : "Activate"} onClick={async () => {
                      await axiosInstance.patch(`/admin/product-batches/${batch._id}`, { active: !batch.active });
                      load();
                    }} />
                    <IconButton icon={Pencil} label="Edit batch" onClick={() => startEdit(batch)} />
                    <IconButton icon={Trash2} label="Delete batch" tone="danger" onClick={() => deleteBatch(batch)} />
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
