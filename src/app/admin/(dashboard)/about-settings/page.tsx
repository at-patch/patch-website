"use client";

import { useEffect, useState } from "react";
import { FileText, ImageIcon, Plus, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Button,
  ErrorBanner,
  FormInput,
  FormTextarea,
  PageHeader,
} from "@/components/admin/ui";
import type { AboutSettings, ApiResponse } from "@/types";

type NarrativeForm = {
  title: string;
  body: string;
  image: string;
};

const EMPTY_NARRATIVE = { title: "", body: "", image: "" };

export default function AboutSettingsPage() {
  const [eyebrow, setEyebrow] = useState("Our Story");
  const [heroTitle, setHeroTitle] = useState("Waste nothing, wear everything.");
  const [narratives, setNarratives] = useState<NarrativeForm[]>([EMPTY_NARRATIVE]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axiosInstance.get<ApiResponse<AboutSettings>>("/admin/about-settings").then(({ data }) => {
      setEyebrow(data.data.eyebrow);
      setHeroTitle(data.data.heroTitle);
      setNarratives(data.data.narratives.map((item) => ({ ...item, image: item.image ?? "" })));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await axiosInstance.put("/admin/about-settings", {
        eyebrow,
        heroTitle,
        narratives,
      });
      setSaved(true);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save About settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="About Us Settings"
        description="Edit the storefront About/Story page copy and images."
        action={<Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save about page"}</Button>}
      />

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}
      {saved && <p className="mt-4 text-sm font-medium text-patch-accent">Saved.</p>}

      <div className="mt-6 rounded-2xl border border-patch-line bg-patch-bg p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Hero eyebrow" value={eyebrow} onChange={setEyebrow} required />
          <FormInput label="Hero title" value={heroTitle} onChange={setHeroTitle} required />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {narratives.map((item, index) => (
          <div key={index} className="rounded-2xl border border-patch-line bg-patch-bg p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-patch-ink">Narrative {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                icon={Trash2}
                onClick={() => setNarratives(narratives.filter((_, i) => i !== index))}
                disabled={narratives.length === 1}
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ImageUploader
                  images={item.image ? [item.image] : []}
                  onChange={(images) => setNarratives(narratives.map((row, i) => i === index ? { ...row, image: images[0] ?? "" } : row))}
                  label="Image"
                  uploadFolder="products"
                  multiple={false}
                />
              </div>
              <div className="space-y-4">
                <FormInput
                  icon={ImageIcon}
                  label="Title"
                  value={item.title}
                  onChange={(v) => setNarratives(narratives.map((row, i) => i === index ? { ...row, title: v } : row))}
                  required
                />
                <FormTextarea
                  label="Body"
                  value={item.body}
                  onChange={(v) => setNarratives(narratives.map((row, i) => i === index ? { ...row, body: v } : row))}
                  rows={5}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        icon={Plus}
        className="mt-4"
        onClick={() => setNarratives([...narratives, EMPTY_NARRATIVE])}
      >
        Add narrative block
      </Button>
    </div>
  );
}
