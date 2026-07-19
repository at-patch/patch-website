import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import PostModel from "@/lib/models/Post";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/story`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    await connectToDatabase();
    const [products, posts] = await Promise.all([
      ProductModel.find({ status: { $ne: "archived" } }).select("slug updatedAt").lean(),
      PostModel.find({ published: true }).select("slug updatedAt").lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/shop/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...postRoutes];
  } catch {
    // DB unavailable at build/request time — still serve the static routes.
    return staticRoutes;
  }
}
