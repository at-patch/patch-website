"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types";

export function ImageUploader({
  images,
  onChange,
  label = "Images",
  uploadFolder = "products",
  multiple = true,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  uploadFolder?: "products" | "categories";
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", uploadFolder);
        const { data } = await axiosInstance.post<ApiResponse<{ url: string }>>(
          "/admin/upload",
          formData,
          { headers: { "Content-Type": undefined } }
        );
        uploaded.push(data.data.url);
      }
      onChange(multiple ? [...images, ...uploaded] : uploaded.slice(-1));
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Upload failed."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>

      <div className="mt-2 flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src + i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <Image src={src} alt={`Image ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-zinc-500 hover:border-black/40 disabled:opacity-50 dark:border-white/20"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="text-[10px]">{uploading ? "Uploading…" : "Add"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
