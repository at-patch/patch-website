import Link from "next/link";
import { cn } from "@/lib/utils";

export function PromoBanner({
  eyebrow,
  title,
  body,
  cta,
  reverse = false,
  accent = "accent",
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  reverse?: boolean;
  accent?: "accent" | "accent-2" | "accent-3";
}) {
  const accentVar = `var(--patch-${accent})`;

  return (
    <section className={cn("grid sm:grid-cols-2", reverse && "sm:[direction:rtl]")}>
      <div className="aspect-[4/3] sm:aspect-auto" style={{ backgroundColor: accentVar }} />
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
