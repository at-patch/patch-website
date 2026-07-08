import { Scissors, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import { HeroSlider } from "@/components/store/HeroSlider";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { PromoBanner } from "@/components/store/PromoBanner";
import { ProductCarouselSection } from "@/components/store/ProductCarouselSection";
import { PhilosophySection } from "@/components/store/PhilosophySection";
import { TestimonialCarousel } from "@/components/store/TestimonialCarousel";
import { InstagramGrid } from "@/components/store/InstagramGrid";
import { TrustBadges } from "@/components/store/TrustBadges";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

async function getHomeProducts() {
  await connectToDatabase();
  const products = await ProductModel.find({ status: "available" })
    .sort({ createdAt: -1 })
    .limit(16)
    .lean();
  const list: Product[] = JSON.parse(JSON.stringify(products));
  return {
    bestSelling: list.slice(0, 8),
    newArrivals: list.slice(8, 16).length > 0 ? list.slice(8, 16) : list.slice(0, 8),
  };
}

export default async function HomePage() {
  const { bestSelling, newArrivals } = await getHomeProducts();

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
      <TestimonialCarousel />
      <InstagramGrid />
      <TrustBadges />
    </div>
  );
}
