import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import CategoryModel from "@/lib/models/Category";
import { mergeCategoriesWithSamples } from "@/lib/sample-catalog";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const FALLBACK_COLORS = [
  "var(--patch-ink)",
  "var(--patch-accent)",
  "var(--patch-accent-2)",
  "var(--patch-accent-3)",
  "var(--patch-bg-alt)",
];

async function getCategories() {
  try {
    await connectToDatabase();
    const categories = await CategoryModel.find({}).sort({ order: 1 }).lean();
    return mergeCategoriesWithSamples(JSON.parse(JSON.stringify(categories)) as Category[]);
  } catch {
    return mergeCategoriesWithSamples([]);
  }
}

export async function CategoryGrid() {
  const categories = await getCategories();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="font-heading text-center text-3xl font-extrabold tracking-tight text-patch-ink">
        Shop by Category
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {categories.map((cat, i) => {
          const color = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const isLight = !cat.image && color === "var(--patch-bg-alt)";
          return (
            <Link key={cat._id} href={`/shop?category=${cat.slug}`} className="group block">
              <div
                className="relative flex aspect-[3/4] items-end overflow-hidden p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                style={cat.image ? undefined : { backgroundColor: color }}
              >
                {cat.image && (
                  <>
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </>
                )}
                <ArrowUpRight
                  size={18}
                  className={cn(
                    "absolute right-4 top-4 z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
                    isLight ? "text-patch-ink" : "text-white"
                  )}
                />
                <p
                  className={cn(
                    "relative z-10 font-heading text-lg font-extrabold uppercase leading-none tracking-tight",
                    isLight ? "text-patch-ink" : "text-white"
                  )}
                >
                  {cat.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
