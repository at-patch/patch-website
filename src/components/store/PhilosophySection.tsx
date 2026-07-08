import Link from "next/link";
import { Leaf, Scissors, Sparkles } from "lucide-react";

const PILLARS = [
  { icon: Sparkles, label: "Confident", body: "Cuts and color that hold their own." },
  { icon: Scissors, label: "Crafted", body: "Finished by hand, seam by seam." },
  { icon: Leaf, label: "Conscious", body: "Fabric sourced with less waste." },
];

export function PhilosophySection() {
  return (
    <section className="bg-patch-ink py-24 text-center text-patch-bg">
      <div className="mx-auto max-w-xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-accent">Our Philosophy</p>
        <h2 className="font-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bold style, made a little more thoughtfully.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-patch-bg/70">
          We design for how you actually want to look and feel — sharp, confident, current. And
          along the way, we cut waste where we can, sourcing fabric responsibly instead of by default.
        </p>
        <Link href="/story" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">
          Read More
        </Link>
      </div>
      <div className="mx-auto mt-16 grid max-w-3xl gap-10 px-6 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.label} className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-patch-bg/10">
              <pillar.icon size={24} strokeWidth={1.5} className="text-patch-accent" />
            </span>
            <p className="text-sm font-semibold">{pillar.label}</p>
            <p className="text-xs leading-relaxed text-patch-bg/60">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
