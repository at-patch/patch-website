"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, isValidImageSrc } from "@/lib/utils";

export function ProductGallery({ images: rawImages, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const images = rawImages.filter(isValidImageSrc);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] rounded-none bg-patch-bg-alt" />
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 sm:grid-cols-1">
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-row">
        {images.map((img, i) => (
          <button
            key={img + i}
            onClick={() => setActive(i)}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-none border",
              active === i ? "border-patch-ink" : "border-transparent opacity-70"
            )}
          >
            <Image src={img} alt={`${name} thumbnail ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative order-1 aspect-[3/4] overflow-hidden rounded-none bg-patch-bg-alt sm:order-2">
        <Image src={images[active]} alt={name} fill priority className="object-cover" />
      </div>
    </div>
  );
}
