import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PromoBanner({
  eyebrow,
  title,
  body,
  cta,
  reverse = false,
  accent = "accent",
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  reverse?: boolean;
  accent?: "accent" | "accent-2" | "accent-3";
  icon?: LucideIcon;
}) {
  const accentVar = `var(--patch-${accent})`;

  return (
    <section className={cn("grid sm:grid-cols-2", reverse && "sm:[direction:rtl]")}>
      <div
        className="relative aspect-[4/3] overflow-hidden sm:aspect-auto"
        style={{ backgroundColor: accentVar }}
      >
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 400 400"
          aria-hidden
        >
          <defs>
            <pattern id={`dots-${accent}`} width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="var(--patch-accent-ink)" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill={`url(#dots-${accent})`} />
        </svg>
        <div
          className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full opacity-20 sm:h-72 sm:w-72"
          style={{ backgroundColor: "var(--patch-accent-ink)" }}
          aria-hidden
        />
        {Icon && (
          <Icon
            className="absolute bottom-6 left-6 text-white opacity-90 sm:bottom-10 sm:left-10"
            size={56}
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </div>
      <div className={cn("flex flex-col justify-center gap-4 px-6 py-16 sm:px-16", reverse && "[direction:ltr]")}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accentVar }}>
          {eyebrow}
        </p>
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-patch-ink sm:text-4xl">{title}</h2>
        <p className="max-w-md text-sm leading-relaxed text-patch-ink-muted">{body}</p>
        <Link
          href={cta.href}
          className="w-fit rounded-full px-6 py-3 text-sm font-semibold text-patch-accent-ink transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentVar }}
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
