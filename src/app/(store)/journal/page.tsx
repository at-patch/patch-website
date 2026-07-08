import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";
import type { Post, PostCategory } from "@/types";

export const dynamic = "force-dynamic";

const CATEGORIES: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sustainability", label: "Sustainability" },
  { value: "styling-tips", label: "Styling Tips" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
];

async function getPosts(category?: string): Promise<Post[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { published: true };
  if (category && category !== "all") filter.category = category;
  const posts = await PostModel.find(filter).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(posts));
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await getPosts(category);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-patch-ink-muted">Journal</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-patch-ink">
        Stories from the Studio
      </h1>

      <div className="mt-8 flex gap-2 border-b border-patch-line pb-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value === "all" ? "/journal" : `/journal?category=${cat.value}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              (category ?? "all") === cat.value
                ? "bg-patch-ink text-patch-bg"
                : "text-patch-ink-muted hover:text-patch-ink"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-patch-ink-muted">
          No stories published yet in this category — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {posts.map((post) => (
            <Link key={post._id} href={`/journal/${post.slug}`} className="group block">
              <div className="aspect-[4/3] rounded-none bg-patch-bg-alt" />
              <p className="mt-4 text-xs uppercase tracking-wide text-patch-ink-muted">
                {post.category.replace("-", " ")} · {new Date(post.createdAt).toLocaleDateString()}
              </p>
              <h2 className="font-heading mt-1 text-lg font-semibold text-patch-ink group-hover:underline">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-patch-ink-muted">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
