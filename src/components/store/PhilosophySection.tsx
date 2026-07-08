import Link from "next/link";

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
    </section>
  );
}
