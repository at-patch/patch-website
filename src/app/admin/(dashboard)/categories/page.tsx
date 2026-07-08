"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageOff, Link2, ListOrdered, Pencil, Plus, Tags, Trash2, Type } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    order: "0",
    images: [] as string[],
  });

  const emptyForm = { name: "", slug: "", order: "0", images: [] as string[] };

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Category>>("/admin/categories");
    setCategories(data.data);
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
      name: form.name,
      slug: form.slug,
      order: Number(form.order),
      image: form.images[0] ?? "",
    };

    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/categories/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/categories", payload);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save category.");
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      slug: c.slug,
      order: String(c.order),
      images: c.image ? [c.image] : [],
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await axiosInstance.delete(`/admin/categories/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Tags}
        title="Categories"
        description="Group products so they're easy to browse in the shop."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            New category
          </Button>
        }
      />

      <Modal
        open={showForm}
        onClose={cancelForm}
        icon={Tags}
        title={editingId ? "Editing category" : "New category"}
        description={editingId ? `Updating ${form.name}` : "Add a category to organize the shop"}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormInput icon={Type} label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <FormInput icon={Link2} label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <FormInput icon={ListOrdered} label="Order" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: v })} />
          <div className="sm:col-span-2">
            <ImageUploader
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              label="Category Image"
              uploadFolder="categories"
              multiple={false}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit">{editingId ? "Update category" : "Save category"}</Button>
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
            <th className={tableCellClass}>Image</th>
            <th className={tableCellClass}>Name</th>
            <th className={tableCellClass}>Slug</th>
            <th className={tableCellClass}>Order</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={5}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Tags} title="No categories yet" description="Create your first category to start organizing products." />
              </td>
            </tr>
          ) : (
            categories.map((c) => (
              <tr key={c._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  {c.image ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-patch-line">
                      <Image src={c.image} alt={c.name} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-patch-line text-patch-ink-muted/60">
                      <ImageOff size={20} />
                    </div>
                  )}
                </td>
                <td className={`${tableCellClass} text-base font-medium text-patch-ink`}>{c.name}</td>
                <td className={`${tableCellClass} font-mono text-sm text-patch-ink-muted`}>{c.slug}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{c.order}</td>
                <td className={`${tableCellClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <IconButton icon={Pencil} label="Edit category" onClick={() => startEdit(c)} />
                    <IconButton icon={Trash2} label="Delete category" tone="danger" onClick={() => deleteCategory(c._id, c.name)} />
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
