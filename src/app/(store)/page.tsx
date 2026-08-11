import { Scissors, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import ReviewModel from "@/lib/models/Review";
import { HeroSlider } from "@/components/store/HeroSlider";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { PromoBanner } from "@/components/store/PromoBanner";
import { ProductCarouselSection } from "@/components/store/ProductCarouselSection";
import { PhilosophySection } from "@/components/store/PhilosophySection";
import { TestimonialCarousel } from "@/components/store/TestimonialCarousel";
import { InstagramGrid } from "@/components/store/InstagramGrid";
import { TrustBadges } from "@/components/store/TrustBadges";
import type { Product, Review } from "@/types";

export const dynamic = "force-dynamic";

async function getHomeProducts() {
  await connectToDatabase();

  const [bestSellerDocs, popularPickDocs, latestDocs] = await Promise.all([
    ProductModel.find({ status: "available", isBestSeller: true }).sort({ bestSellerOrder: 1 }).limit(8).lean(),
    ProductModel.find({ status: "available", isPopularPick: true }).sort({ popularPickOrder: 1 }).limit(8).lean(),
    ProductModel.find({ status: "available" }).sort({ createdAt: -1 }).limit(16).lean(),
  ]);

  const latest: Product[] = JSON.parse(JSON.stringify(latestDocs));
  const bestSelling: Product[] = bestSellerDocs.length > 0 ? JSON.parse(JSON.stringify(bestSellerDocs)) : latest.slice(0, 8);
  const popularPicks: Product[] = popularPickDocs.length > 0 ? JSON.parse(JSON.stringify(popularPickDocs)) : latest.slice(0, 8);
  const newArrivals = latest.slice(8, 16).length > 0 ? latest.slice(8, 16) : latest.slice(0, 8);

  return { bestSelling, popularPicks, newArrivals };
}

async function getHomeReviews() {
  await connectToDatabase();
  const docs = await ReviewModel.find({ featured: true })
    .sort({ order: 1, createdAt: -1 })
    .limit(8)
    .populate("productRef", "name slug price currency images")
    .lean();
  const reviews: Review[] = JSON.parse(JSON.stringify(docs));
  return reviews;
}

export default async function HomePage() {
  const [{ bestSelling, popularPicks, newArrivals }, reviews] = await Promise.all([getHomeProducts(), getHomeReviews()]);

  return (
    <div>
      <HeroSlider />
      <CategoryGrid />
      <PromoBanner
        eyebrow="New Drop"
        title="Color-blocked, cut for confidence."
        body="Bold silhouettes and statement color, styled for how you actually move through your day."
        cta={{ href: "/shop", label: "Shop Now" }}
        accent="accent-2"
        icon={Sparkles}
      />
      <ProductCarouselSection title="Best Selling" products={bestSelling} />
      <ProductCarouselSection title="Popular Picks" products={popularPicks} />
      <PromoBanner
        eyebrow="Made in Dhaka"
        title="Every stitch, done by hand."
        body="Small studio team, careful finishing, a little less waste along the way — fashion that's made thoughtfully."
        cta={{ href: "/story", label: "See the Process" }}
        accent="accent-3"
        icon={Scissors}
        reverse
      />
      <PhilosophySection />
      <ProductCarouselSection title="New Arrivals" products={newArrivals} />
      <TestimonialCarousel reviews={reviews} />
      <InstagramGrid />
      <TrustBadges />
    </div>
  );
}
