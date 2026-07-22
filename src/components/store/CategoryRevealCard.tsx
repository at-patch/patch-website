"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CategoryRevealCard({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.requestAnimationFrame(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      )}
      style={{ transitionDelay: visible ? `${Math.min(index * 80, 320)}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
