"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const AUTOPLAY_DELAY_MS = 5000;

const SLIDES = [
  {
    eyebrow: "New Season",
    title: "Bold looks, made for right now.",
    body: "Statement color, sharp silhouettes, everyday wearability — the new drop is here.",
    cta: { href: "/shop", label: "Shop the Drop" },
    accent: "var(--patch-accent)",
    image:
      "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?fm=jpg&q=80&w=2000&auto=format&fit=crop",
  },
  {
    eyebrow: "The Current Edit",
    title: "New in every week — don't sleep on it.",
    body: "Fresh styles land often and move fast. Get in before your size is gone.",
    cta: { href: "/shop", label: "View New Arrivals" },
    accent: "var(--patch-accent-2)",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?fm=jpg&q=80&w=2000&auto=format&fit=crop",
  },
  {
    eyebrow: "Our Story",
    title: "Made in Dhaka, worn everywhere.",
    body: "Every piece is thoughtfully made, with a little less waste along the way.",
    cta: { href: "/story", label: "Read Our Story" },
    accent: "var(--patch-accent-3)",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?fm=jpg&q=80&w=2000&auto=format&fit=crop",
  },
];

export function HeroSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimer = useRef<number | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const stopAutoplay = useCallback(() => {
    if (!autoplayTimer.current) return;
    window.clearInterval(autoplayTimer.current);
    autoplayTimer.current = null;
  }, []);

  const startAutoplay = useCallback(() => {
    if (!emblaApi || isPaused) return;
    stopAutoplay();
    autoplayTimer.current = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_DELAY_MS);
  }, [emblaApi, isPaused, stopAutoplay]);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial slide state on mount
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", stopAutoplay);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", stopAutoplay);
      stopAutoplay();
    };
  }, [emblaApi, onSelect, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay, selected]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((slide, i) => (
            <div key={slide.title} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="relative h-[78vh] sm:h-[90vh]">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={i === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 px-6 py-10 sm:px-16 sm:py-16">
                  <span
                    className="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-patch-accent-ink"
                    style={{ backgroundColor: slide.accent }}
                  >
                    {slide.eyebrow}
                  </span>
                  <h1 className="font-heading max-w-2xl text-5xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    {slide.title}
                  </h1>
                  <p className="max-w-md text-sm leading-relaxed text-white/75 sm:text-base">{slide.body}</p>
                  <Link
                    href={slide.cta.href}
                    className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-patch-accent-ink transition-all hover:gap-3 hover:opacity-90"
                    style={{ backgroundColor: slide.accent }}
                  >
                    {slide.cta.label}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 hidden items-center gap-4 sm:flex">
        <span className="font-heading text-xs tracking-wide text-white/70">
          {String(selected + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                stopAutoplay();
                emblaApi?.scrollTo(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "relative h-1 overflow-hidden rounded-full transition-all",
                i === selected ? "w-8 bg-white/25" : "w-1 bg-white/30"
              )}
            >
              {i === selected && (
                <span
                  key={`${selected}-${isPaused ? "paused" : "playing"}`}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-white",
                    !isPaused && "animate-[hero-progress_5s_linear_forwards]"
                  )}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              stopAutoplay();
              emblaApi?.scrollPrev();
            }}
            aria-label="Previous slide"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              stopAutoplay();
              emblaApi?.scrollNext();
            }}
            aria-label="Next slide"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
