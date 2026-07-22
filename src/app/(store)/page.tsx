import { Scissors, Sparkles } from "lucide-react";
import { HeroSlider } from "@/components/store/HeroSlider";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { PromoBanner } from "@/components/store/PromoBanner";
import { ProductCarouselSection } from "@/components/store/ProductCarouselSection";
import { PhilosophySection } from "@/components/store/PhilosophySection";
import { TestimonialCarousel } from "@/components/store/TestimonialCarousel";
import { InstagramGrid } from "@/components/store/InstagramGrid";
import { TrustBadges } from "@/components/store/TrustBadges";
import {
  DEFAULT_HOMEPAGE_PROMOS,
  getHomepageProductSections,
  getHomepagePromos,
  type HomepageProductSection,
} from "@/lib/homepage";

export const revalidate = 300;

export default async function HomePage() {
  let productSections: HomepageProductSection[] = [];
  let promos = DEFAULT_HOMEPAGE_PROMOS;

  try {
    [productSections, promos] = await Promise.all([getHomepageProductSections(), getHomepagePromos()]);
  } catch {
    productSections = [];
    promos = DEFAULT_HOMEPAGE_PROMOS;
  }

  return (
    <div>
      <HeroSlider />
      <CategoryGrid />
      <PromoBanner
        eyebrow={promos.primaryPromo.eyebrow}
        title={promos.primaryPromo.title}
        body={promos.primaryPromo.body}
        cta={{ href: promos.primaryPromo.ctaHref, label: promos.primaryPromo.ctaLabel }}
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
        eyebrow={promos.secondaryPromo.eyebrow}
        title={promos.secondaryPromo.title}
        body={promos.secondaryPromo.body}
        cta={{ href: promos.secondaryPromo.ctaHref, label: promos.secondaryPromo.ctaLabel }}
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
