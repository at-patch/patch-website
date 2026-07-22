"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FileText, Hash, ImageIcon, Pencil, Plus, Ruler, Scissors, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  EmptyState,
  ErrorBanner,
  FormInput,
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Pattern } from "@/types";

const EMPTY_FORM = {
  patternImage: "",
  fabricCode: "",
  sampleCode: "",
  fabAmount1: "",
  fabricAmount2: "",
  size1: "",
  size2: "",
};

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Pattern>>("/admin/patterns");
    setPatterns(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
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

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Pattern Code</th>
            <th className={tableCellClass}>Pattern Image</th>
            <th className={tableCellClass}>Fabric Code</th>
            <th className={tableCellClass}>Sample Code</th>
            <th className={tableCellClass}>Fab-Amount 1</th>
            <th className={tableCellClass}>Fabric Amount 2</th>
            <th className={tableCellClass}>Size 1</th>
            <th className={tableCellClass}>Size 2</th>
            <th className={tableCellClass}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={9}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : patterns.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <EmptyState icon={Scissors} title="No patterns yet" description="Add pattern records when the team starts tracking them." />
              </td>
            </tr>
          ) : (
            patterns.map((pattern) => (
              <tr key={pattern._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{pattern.patternCode}</td>
                <td className={tableCellClass}>
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                    {pattern.patternImage ? <Image src={pattern.patternImage} alt="" fill className="object-cover" /> : <ImageIcon size={16} className="m-4 text-patch-ink-muted" />}
                  </div>
                </td>
                <td className={`${tableCellClass} text-patch-ink`}>{pattern.fabricCode}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{pattern.sampleCode || "—"}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{pattern.fabAmount1}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{pattern.fabricAmount2}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{pattern.size1}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{pattern.size2}</td>
                <td className={tableCellClass}>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" icon={Pencil} onClick={() => openEdit(pattern)}>
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" icon={Trash2} onClick={() => removePattern(pattern._id)}>
                      Delete
                    </Button>
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
