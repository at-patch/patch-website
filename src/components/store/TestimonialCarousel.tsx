"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, User } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";
import { formatPrice } from "@/lib/utils";
import type { Review } from "@/types";

export function TestimonialCarousel({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="font-heading text-center text-2xl font-extrabold tracking-tight text-patch-ink">Happy Customers</h2>
      <p className="mt-2 text-center text-sm text-patch-ink-muted">
        Customers love our products and we always strive to please them all.
      </p>
      <div className="mt-8">
        <Carousel showDots showArrows={false} slideClassName="w-full sm:w-[48%]">
          {reviews.map((review) => {
            const product = typeof review.productRef === "object" ? review.productRef : undefined;
            return (
              <div
                key={review._id}
                className="flex gap-4 overflow-hidden rounded-2xl border border-patch-line bg-patch-bg p-4 sm:gap-6 sm:p-5"
              >
                {review.photo ? (
                  <div className="relative h-full min-h-40 w-32 shrink-0 overflow-hidden rounded-xl sm:w-40">
                    <Image src={review.photo} alt={review.customerName} fill sizes="160px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded-xl bg-patch-ink/5 text-patch-ink-muted sm:w-40">
                    <User size={28} />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm font-medium text-patch-ink">
                    {review.customerName}
                    {review.verifiedBuyer && <span className="ml-1.5 text-xs font-normal text-patch-ink-muted">✓ Verified Buyer</span>}
                  </p>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-patch-ink-muted">{review.reviewText}</p>

                  {product && (
                    <Link
                      href={`/shop/${product.slug}`}
                      className="mt-auto flex items-center gap-3 border-t border-patch-line pt-3"
                    >
                      {product.images?.[0] && (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-patch-line">
                          <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-patch-ink">{product.name}</p>
                        <p className="text-xs text-patch-ink-muted">{formatPrice(product.price, product.currency)}</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </Carousel>
      </div>
    </section>
  );
}
