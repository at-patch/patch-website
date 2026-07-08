"use client";

import { Carousel } from "@/components/ui/Carousel";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/types";

export function ProductCarouselSection({ title, products }: { title: string; products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">{title}</h2>
      <div className="mt-8">
        <Carousel slideClassName="w-[70%] sm:w-[45%] lg:w-[23%]">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
