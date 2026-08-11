"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ImageOff,
  ListOrdered,
  MessageSquareQuote,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  FormInput,
  FormSelect,
  FormTextarea,
  IconButton,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Product, Review } from "@/types";

type FeaturedField = "isBestSeller" | "bestSellerOrder" | "isPopularPick" | "popularPickOrder";

function FeaturedProductsTable({
  title,
  icon: Icon,
  products,
  flagField,
  orderField,
  onUpdate,
}: {
  title: string;
  icon: typeof TrendingUp;
  products: Product[];
  flagField: FeaturedField;
  orderField: FeaturedField;
  onUpdate: (id: string, patch: Partial<Pick<Product, FeaturedField>>) => void;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className="text-patch-ink-muted" />
        <h2 className="font-heading text-lg font-semibold tracking-tight text-patch-ink">{title}</h2>
      </div>
      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Product</th>
            <th className={tableCellClass}>Price</th>
            <th className={tableCellClass}>Show in section</th>
            <th className={tableCellClass}>Order</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {products.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState icon={Icon} title="No products available" description="Add products first, then feature them here." />
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p._id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-3">
                    {p.images?.[0] ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-patch-line">
                        <Image src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-patch-line text-patch-ink-muted/60">
                        <ImageOff size={16} />
                      </div>
                    )}
                    <p className="truncate text-sm font-medium text-patch-ink">{p.name}</p>
                  </div>
                </td>
                <td className={`${tableCellClass} whitespace-nowrap text-patch-ink-muted`}>{formatPrice(p.price, p.currency)}</td>
                <td className={tableCellClass}>
                  <input
                    type="checkbox"
                    checked={Boolean(p[flagField])}
                    onChange={(e) => onUpdate(p._id, { [flagField]: e.target.checked })}
                    className="h-4 w-4 cursor-pointer accent-patch-ink"
                  />
                </td>
                <td className={tableCellClass}>
                  <input
                    type="number"
                    defaultValue={Number(p[orderField] ?? 0)}
                    onBlur={(e) => onUpdate(p._id, { [orderField]: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-patch-line bg-patch-bg px-2.5 py-1.5 text-sm text-patch-ink outline-none focus:border-patch-accent"
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

export default function AdminHomepagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyForm = {
    customerName: "",
    rating: "5",
    reviewText: "",
    photo: [] as string[],
    productRef: "",
    verifiedBuyer: true,
    featured: true,
    order: "0",
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const [{ data: productData }, { data: reviewData }] = await Promise.all([
      axiosInstance.get<ApiListResponse<Product>>("/admin/products"),
      axiosInstance.get<ApiListResponse<Review>>("/admin/reviews"),
    ]);
    setProducts(productData.data);
    setReviews(reviewData.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const updateProductFlag = async (id: string, patch: Partial<Pick<Product, FeaturedField>>) => {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } as Product : p)));
    await axiosInstance.patch(`/admin/products/${id}`, patch);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      customerName: form.customerName,
      rating: Number(form.rating),
      reviewText: form.reviewText,
      photo: form.photo[0] ?? "",
      productRef: form.productRef,
      verifiedBuyer: form.verifiedBuyer,
      featured: form.featured,
      order: Number(form.order),
    };

    try {
      if (editingId) {
        await axiosInstance.patch(`/admin/reviews/${editingId}`, payload);
      } else {
        await axiosInstance.post("/admin/reviews", payload);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save review.");
    }
  };

  const startEdit = (r: Review) => {
    setEditingId(r._id);
    setForm({
      customerName: r.customerName,
      rating: String(r.rating),
      reviewText: r.reviewText,
      photo: r.photo ? [r.photo] : [],
      productRef: typeof r.productRef === "string" ? r.productRef : r.productRef?._id ?? "",
      verifiedBuyer: r.verifiedBuyer,
      featured: r.featured,
      order: String(r.order),
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const deleteReview = async (id: string, name: string) => {
    if (!window.confirm(`Delete the review from "${name}"? This can't be undone.`)) return;
    await axiosInstance.delete(`/admin/reviews/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Homepage Sections"
        description="Curate what shows up in Best Selling, Popular Picks, and Happy Customers on the homepage."
      />

      {loading ? (
        <div className="mt-8 animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-patch-ink/5" />
          ))}
        </div>
      ) : (
        <>
          <FeaturedProductsTable
            title="Best Selling"
            icon={TrendingUp}
            products={products}
            flagField="isBestSeller"
            orderField="bestSellerOrder"
            onUpdate={updateProductFlag}
          />

          <FeaturedProductsTable
            title="Popular Picks"
            icon={Sparkles}
            products={products}
            flagField="isPopularPick"
            orderField="popularPickOrder"
            onUpdate={updateProductFlag}
          />

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquareQuote size={18} className="text-patch-ink-muted" />
                <h2 className="font-heading text-lg font-semibold tracking-tight text-patch-ink">Happy Customers</h2>
              </div>
              <Button icon={Plus} onClick={() => setShowForm(true)}>
                New review
              </Button>
            </div>

            <Modal
              open={showForm}
              onClose={cancelForm}
              icon={MessageSquareQuote}
              title={editingId ? "Editing review" : "New review"}
              description={editingId ? `Updating ${form.customerName}` : "Add a customer review to show on the homepage"}
            >
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  icon={User}
                  label="Customer name"
                  value={form.customerName}
                  onChange={(v) => setForm({ ...form, customerName: v })}
                  required
                />
                <FormSelect icon={Star} label="Rating" value={form.rating} onChange={(v) => setForm({ ...form, rating: v })}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </FormSelect>

                <div className="sm:col-span-2">
                  <FormTextarea
                    icon={MessageSquareQuote}
                    label="Review text"
                    value={form.reviewText}
                    onChange={(v) => setForm({ ...form, reviewText: v })}
                    rows={3}
                    required
                  />
                </div>

                <FormSelect label="Linked product (optional)" value={form.productRef} onChange={(v) => setForm({ ...form, productRef: v })}>
                  <option value="">None</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </FormSelect>

                <FormInput
                  icon={ListOrdered}
                  label="Order"
                  type="number"
                  value={form.order}
                  onChange={(v) => setForm({ ...form, order: v })}
                />

                <div className="sm:col-span-2">
                  <ImageUploader
                    images={form.photo}
                    onChange={(photo) => setForm({ ...form, photo })}
                    label="Customer photo"
                    uploadFolder="reviews"
                    multiple={false}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-patch-ink">
                  <input
                    type="checkbox"
                    checked={form.verifiedBuyer}
                    onChange={(e) => setForm({ ...form, verifiedBuyer: e.target.checked })}
                    className="h-4 w-4 accent-patch-ink"
                  />
                  Verified buyer
                </label>
                <label className="flex items-center gap-2 text-sm text-patch-ink">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4 w-4 accent-patch-ink"
                  />
                  Show on homepage
                </label>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <Button type="submit">{editingId ? "Update review" : "Save review"}</Button>
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

            {reviews.length === 0 ? (
              <Card className="mt-4">
                <EmptyState icon={MessageSquareQuote} title="No reviews yet" description="Add your first customer review." />
              </Card>
            ) : (
              <TableCard>
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableCellClass}>Customer</th>
                    <th className={tableCellClass}>Rating</th>
                    <th className={tableCellClass}>Review</th>
                    <th className={tableCellClass}>Product</th>
                    <th className={tableCellClass}>Visible</th>
                    <th className={tableCellClass}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-patch-line">
                  {reviews.map((r) => (
                    <tr key={r._id} className={tableRowClass}>
                      <td className={tableCellClass}>
                        <div className="flex items-center gap-3">
                          {r.photo ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-patch-line">
                              <Image src={r.photo} alt={r.customerName} fill sizes="40px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-patch-line text-patch-ink-muted/60">
                              <User size={14} />
                            </div>
                          )}
                          <p className="text-sm font-medium text-patch-ink">{r.customerName}</p>
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                          ))}
                        </div>
                      </td>
                      <td className={`${tableCellClass} max-w-xs truncate text-patch-ink-muted`}>{r.reviewText}</td>
                      <td className={`${tableCellClass} text-patch-ink-muted`}>
                        {typeof r.productRef === "object" && r.productRef ? r.productRef.name : "—"}
                      </td>
                      <td className={`${tableCellClass} text-patch-ink-muted`}>{r.featured ? "Yes" : "No"}</td>
                      <td className={`${tableCellClass} text-right`}>
                        <div className="flex justify-end gap-1">
                          <IconButton icon={Pencil} label="Edit review" onClick={() => startEdit(r)} />
                          <IconButton icon={Trash2} label="Delete review" tone="danger" onClick={() => deleteReview(r._id, r.customerName)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}
