import { Scissors, Sparkles } from "lucide-react";
import { HeroSlider } from "@/components/store/HeroSlider";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { PromoBanner } from "@/components/store/PromoBanner";
import { ProductCarouselSection } from "@/components/store/ProductCarouselSection";
import { PhilosophySection } from "@/components/store/PhilosophySection";
import { TestimonialCarousel } from "@/components/store/TestimonialCarousel";
import { InstagramGrid } from "@/components/store/InstagramGrid";
import { TrustBadges } from "@/components/store/TrustBadges";
import { getHomepageProductSections, type HomepageProductSection } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let productSections: HomepageProductSection[] = [];

  try {
    productSections = await getHomepageProductSections();
  } catch {
    productSections = [];
  }

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
      {productSections[0] && (
        <ProductCarouselSection
          title={productSections[0].title}
          description={productSections[0].description}
          products={productSections[0].products}
          index={0}
        />
      )}
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
      {productSections.slice(1).map((section, i) => (
        <ProductCarouselSection
          key={section.id}
          title={section.title}
          description={section.description}
          products={section.products}
          index={i + 1}
        />
      ))}
      <TestimonialCarousel />
      <InstagramGrid />
      <TrustBadges />
    </div>
  );
}
