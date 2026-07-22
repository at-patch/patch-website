import Link from "next/link";
import Image from "next/image";
import { Hammer, Recycle, Ruler, Shirt } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import AboutSettingsModel from "@/lib/models/AboutSettings";

type StoryNarrative = {
  title: string;
  body: string;
  image?: string;
};

const NARRATIVE: StoryNarrative[] = [
  {
    title: "Every garment starts as waste.",
    body: "Bangladesh produces more garment waste than almost anywhere else on earth — factory offcuts, returned stock, donated clothing that would otherwise end up landfilled or burned. Patch exists to interrupt that cycle.",
  },
  {
    title: "We rework it by hand.",
    body: "We collect raw material — offcuts, donated garments, factory deadstock — log it, sort it, and rework it by hand into new pieces. Because the input is never uniform, no two Patch garments are the same.",
  },
  {
    title: "Scarcity isn't a marketing trick.",
    body: "When a piece sells, it's gone. We don't reprint, we don't restock — the next batch is made from whatever waste comes in next. That's just how the material works.",
  },
];

const PROCESS = [
  { icon: Recycle, title: "Rescue Fabric", body: "Sourced from offcuts, donations, and factory deadstock." },
  { icon: Ruler, title: "Design", body: "Each batch is planned around what the material allows." },
  { icon: Hammer, title: "Handcraft", body: "Cut, reworked, and finished by the Patch studio team." },
  { icon: Shirt, title: "Wear", body: "One-of-one pieces, ready for a life beyond the landfill." },
];

async function getAboutSettings() {
  try {
    await connectToDatabase();
    const settings = await AboutSettingsModel.findOne({ key: "about" }).lean<{
      eyebrow?: string;
      heroTitle?: string;
      narratives?: StoryNarrative[];
    } | null>();

    return {
      eyebrow: settings?.eyebrow || "Our Story",
      heroTitle: settings?.heroTitle || "Waste nothing, wear everything.",
      narratives: settings?.narratives?.length ? settings.narratives : NARRATIVE,
    };
  } catch {
    return {
      eyebrow: "Our Story",
      heroTitle: "Waste nothing, wear everything.",
      narratives: NARRATIVE,
    };
  }
}

export default async function StoryPage() {
  const about = await getAboutSettings();

  return (
    <div>
      <section className="flex min-h-[50vh] flex-col items-center justify-center bg-patch-ink px-6 py-24 text-center text-patch-bg">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-patch-bg/60">{about.eyebrow}</p>
        <h1 className="font-heading mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {about.heroTitle}
        </h1>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="space-y-20">
          {about.narratives.map((block, i) => (
            <div
              key={block.title}
              className={`flex flex-col gap-8 sm:flex-row sm:items-center ${i % 2 === 1 ? "sm:flex-row-reverse" : ""}`}
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-none bg-patch-bg-alt sm:w-1/2">
                {block.image ? (
                  <Image src={block.image} alt="" fill className="object-cover" />
                ) : null}
              </div>
              <div className="sm:w-1/2">
                <h2 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">
                  {block.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-patch-ink-muted">{block.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-patch-bg-alt py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-center text-2xl font-extrabold tracking-tight text-patch-ink">
            Our Process
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PROCESS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-patch-ink text-patch-bg">
                  <step.icon size={22} />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-patch-ink-muted">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-heading text-base font-semibold text-patch-ink">{step.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-patch-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <p className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">
          {about.heroTitle}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Shop the Collection
        </Link>
      </section>
    </div>
  );
}
