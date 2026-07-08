"use client";

import Link from "next/link";
import { Carousel } from "@/components/ui/Carousel";

const TESTIMONIALS = [
  {
    quote: "The fit is unreal — finally pants that work for both my commute and going out after.",
    name: "Nusrat H.",
    product: "Wide-Leg Trousers",
  },
  {
    quote: "The color, the cut, the finishing — it genuinely feels like a much pricier brand.",
    name: "Rafiul K.",
    product: "Crop Top",
  },
  {
    quote: "Loved that it's made responsibly too — great to not have to choose between style and conscience.",
    name: "Sadia A.",
    product: "Wrap Dress",
  },
];

export function TestimonialCarousel() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-heading text-center text-2xl font-extrabold tracking-tight text-patch-ink">
        From the Community
      </h2>
      <div className="mt-8">
        <Carousel showDots showArrows={false} slideClassName="w-full basis-full">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="px-4 text-center">
              <p className="font-heading text-lg leading-relaxed text-patch-ink">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm text-patch-ink-muted">
                {t.name} —{" "}
                <Link href="/shop" className="underline underline-offset-4">
                  {t.product}
                </Link>
              </p>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
