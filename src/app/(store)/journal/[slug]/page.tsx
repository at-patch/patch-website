import { notFound } from "next/navigation";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";
import { FacebookIcon, TwitterIcon } from "@/components/ui/SocialIcons";
import type { Post } from "@/types";

export const dynamic = "force-dynamic";

async function getPost(slug: string): Promise<Post | null> {
  await connectToDatabase();
  const post = await PostModel.findOne({ slug, published: true }).lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
}

async function getRelatedPosts(category: string, excludeId: string): Promise<Post[]> {
  await connectToDatabase();
  const posts = await PostModel.find({ category, published: true, _id: { $ne: excludeId } })
    .limit(3)
    .lean();
  return JSON.parse(JSON.stringify(posts));
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post._id);

  return (
    <div>
      <div className="aspect-[16/7] bg-patch-bg-alt" />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-wide text-patch-ink-muted">
          {post.category.replace("-", " ")} · {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-patch-ink">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-patch-ink-muted">By {post.author}</p>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-patch-ink-muted">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-3 border-t border-patch-line pt-6">
          <span className="text-xs text-patch-ink-muted">Share:</span>
          <a href="#" aria-label="Share on Facebook" className="text-patch-ink-muted hover:text-patch-ink">
            <FacebookIcon size={16} />
          </a>
          <a href="#" aria-label="Share on Twitter" className="text-patch-ink-muted hover:text-patch-ink">
            <TwitterIcon size={16} />
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-patch-ink">Related Stories</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p._id} href={`/journal/${p.slug}`} className="group block">
                <div className="aspect-[4/3] rounded-none bg-patch-bg-alt" />
                <p className="mt-3 text-sm font-medium text-patch-ink group-hover:underline">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
