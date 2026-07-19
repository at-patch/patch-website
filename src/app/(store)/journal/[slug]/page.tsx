import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";
import { FacebookIcon, TwitterIcon } from "@/components/ui/SocialIcons";
import { SITE_URL } from "@/lib/constants";
import { isValidImageSrc } from "@/lib/utils";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post._id);
  const shareUrl = `${SITE_URL}/journal/${post.slug}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`;

  return (
    <div>
      <div className="relative aspect-[16/7] bg-patch-bg-alt">
        {isValidImageSrc(post.coverImage) && (
          <Image src={post.coverImage} alt={post.title} fill priority className="object-cover" />
        )}
      </div>

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
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="text-patch-ink-muted hover:text-patch-ink"
          >
            <FacebookIcon size={16} />
          </a>
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Twitter"
            className="text-patch-ink-muted hover:text-patch-ink"
          >
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
                <div className="relative aspect-[4/3] overflow-hidden rounded-none bg-patch-bg-alt">
                  {isValidImageSrc(p.coverImage) && (
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-patch-ink group-hover:underline">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
