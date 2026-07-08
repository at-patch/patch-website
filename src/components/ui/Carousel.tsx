"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Carousel({
  children,
  slideClassName,
  showArrows = true,
  showDots = false,
}: {
  children: React.ReactNode[];
  slideClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial slide state on mount
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {children.map((child, i) => (
            <div key={i} className={cn("min-w-0 shrink-0 grow-0", slideClassName)}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-patch-bg/90 text-patch-ink shadow disabled:opacity-0"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label="Next"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-patch-bg/90 text-patch-ink shadow disabled:opacity-0"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {showDots && (
        <div className="mt-4 flex justify-center gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-patch-ink" : "w-1.5 bg-patch-line"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
