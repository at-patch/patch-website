"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Link2, Plus, Tags, Trash2, Type, User } from "lucide-react";
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
  Modal,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import type { ApiListResponse, Post, PostCategory } from "@/types";

const CATEGORIES: PostCategory[] = ["sustainability", "styling-tips", "behind-the-scenes"];

export default function AdminJournalPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "sustainability" as PostCategory,
    author: "The Patch Team",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Post>>("/admin/posts");
    setPosts(data.data);
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
      await axiosInstance.post("/admin/posts", form);
      setForm({ title: "", slug: "", excerpt: "", content: "", category: "sustainability", author: "The Patch Team" });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create post.");
    }
  };

  const togglePublished = async (id: string, published: boolean) => {
    await axiosInstance.patch(`/admin/posts/${id}`, { published: !published });
    load();
  };

  const deletePost = async (id: string) => {
    await axiosInstance.delete(`/admin/posts/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Journal"
        description="Share stories about the pieces and the process behind them."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            New post
          </Button>
        }
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} icon={BookOpen} title="New post" description="Publish a new journal entry">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <FormInput icon={Type} label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <FormInput icon={Link2} label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <FormSelect icon={Tags} label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v as PostCategory })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FormSelect>
          <FormInput icon={User} label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
          <div className="sm:col-span-2">
            <FormTextarea icon={FileText} label="Excerpt" value={form.excerpt} onChange={(v) => setForm({ ...form, excerpt: v })} rows={2} required />
          </div>
          <div className="sm:col-span-2">
            <FormTextarea
              icon={BookOpen}
              label="Content (paragraphs separated by blank lines)"
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
              rows={6}
              required
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit">Save post</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
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
            <th className={tableCellClass}>Title</th>
            <th className={tableCellClass}>Category</th>
            <th className={tableCellClass}>Published</th>
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={4}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : posts.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState icon={BookOpen} title="No posts yet" description="Publish your first journal entry." />
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{post.title}</td>
                <td className={`${tableCellClass} capitalize text-patch-ink-muted`}>{post.category.replace("-", " ")}</td>
                <td className={tableCellClass}>
                  <button onClick={() => togglePublished(post._id, post.published)}>
                    <Badge tone={post.published ? "green" : "neutral"}>{post.published ? "Published" : "Draft"}</Badge>
                  </button>
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <IconButton icon={Trash2} label="Delete post" tone="danger" onClick={() => deletePost(post._id)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
