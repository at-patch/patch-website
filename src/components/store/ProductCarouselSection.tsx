"use client";

import { Flame, Sparkles, Tag } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/types";

const ACCENTS = [
  {
    icon: Sparkles,
    text: "text-patch-accent-2",
    bg: "bg-patch-accent-2/10",
    ring: "ring-patch-accent-2/20",
    glow: "from-patch-accent-2/15",
  },
  {
    icon: Flame,
    text: "text-patch-accent-3",
    bg: "bg-patch-accent-3/10",
    ring: "ring-patch-accent-3/20",
    glow: "from-patch-accent-3/15",
  },
  {
    icon: Tag,
    text: "text-patch-accent",
    bg: "bg-patch-accent/10",
    ring: "ring-patch-accent/20",
    glow: "from-patch-accent/15",
  },
];

export function ProductCarouselSection({
  title,
  description,
  products,
  index = 0,
}: {
  title: string;
  description?: string;
  products: Product[];
  index?: number;
}) {
  if (products.length === 0) return null;

  const accent = ACCENTS[index % ACCENTS.length];
  const Icon = accent.icon;

  return (
    <section className="relative overflow-hidden py-16">
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-b ${accent.glow} to-transparent blur-3xl`}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent.bg} ring-1 ${accent.ring}`}
          >
            <Icon size={20} className={accent.text} strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">{title}</h2>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-patch-ink-muted">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-8">
          <Carousel slideClassName="w-[70%] sm:w-[45%] lg:w-[23%]">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
