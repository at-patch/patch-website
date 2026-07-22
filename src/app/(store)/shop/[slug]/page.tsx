import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductVariantPicker } from "@/components/store/ProductVariantPicker";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductAccordion } from "@/components/store/ProductAccordion";
import { WishlistButton } from "@/components/store/WishlistButton";
import { StickyAddToCartBar } from "@/components/store/StickyAddToCartBar";
import { ProductCarouselSection } from "@/components/store/ProductCarouselSection";
import {
  getSampleProductBySlug,
  getSampleRelatedProducts,
  hydrateProductsWithSampleImages,
  topUpProducts,
} from "@/lib/sample-catalog";
import { formatPrice, getTotalQuantity } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

async function getProduct(slug: string): Promise<Product | null> {
  try {
    await connectToDatabase();
    const product = await ProductModel.findOne({ slug }).lean();
    if (product) return hydrateProductsWithSampleImages([JSON.parse(JSON.stringify(product)) as Product])[0];
  } catch {
    // Fall through to sample catalog below.
  }

  return getSampleProductBySlug(slug);
}

async function getRelatedProducts(category: string, excludeId: string): Promise<Product[]> {
  try {
    await connectToDatabase();
    const related = await ProductModel.find({
      category,
      status: "available",
      _id: { $ne: excludeId },
    })
      .limit(8)
      .lean();
    return hydrateProductsWithSampleImages(topUpProducts(JSON.parse(JSON.stringify(related)) as Product[], 8))
      .filter((product) => product.category === category && product._id !== excludeId)
      .slice(0, 8);
  } catch {
    return getSampleRelatedProducts(category, excludeId);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  const image = product.images[0];

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product._id);
  const totalQuantity = getTotalQuantity(product);
  const uniqueSizes = Array.from(new Set((product.variants ?? []).map((variant) => variant.size)));

  const availability =
    product.status === "sold"
      ? "https://schema.org/SoldOut"
      : totalQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <span className="inline-block rounded-full bg-patch-accent px-2.5 py-1 text-[11px] font-semibold tracking-wide text-patch-accent-ink">
            {product.batchLabel}
          </span>
          <h1 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-patch-ink">
            {product.name}
          </h1>
          <p className="mt-1 text-lg font-bold text-patch-ink">{formatPrice(product.price, product.currency)}</p>

          <p className="mt-2 text-sm font-semibold text-patch-accent-3">
            {product.status === "sold"
              ? "Sold"
              : product.status === "reserved"
                ? "Reserved"
                : product.rarity === "multi-quantity"
                  ? totalQuantity > 0
                    ? `${totalQuantity} available across variants`
                    : "Out of stock"
                  : "Only 1 available"}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-patch-ink-muted">{product.description}</p>

          <div id="add-to-cart" className="mt-8 flex gap-3">
            <div className="flex-1">
              {product.rarity === "multi-quantity" ? (
                <ProductVariantPicker product={product} />
              ) : (
                <AddToCartButton product={product} />
              )}
            </div>
            <WishlistButton productId={product._id} />
          </div>

          <div className="mt-10">
            <ProductAccordion
              sections={[
                {
                  title: "Description",
                  body: product.description,
                },
                {
                  title: "Material & Care",
                  body: (
                    <div className="space-y-2">
                      <p>Materials: {product.materials.join(", ") || "—"}</p>
                      <p>Size: {product.rarity === "multi-quantity" ? uniqueSizes.join(", ") || "—" : product.size}</p>
                      {product.story && <p className="italic">{product.story}</p>}
                      <p>
                        Hand-wash or gentle-cycle cold, air-dry, do not bleach — mixed-fabric panels
                        can react differently to heat.
                      </p>
                    </div>
                  ),
                },
                {
                  title: "Shipping & Returns",
                  body: "Ships within Dhaka in 2–4 business days, nationwide in 4–7 business days. Exchanges are size/fit only within 7 days — some styles are limited-run, so restocks aren't guaranteed. No cash refunds or returns.",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && <ProductCarouselSection title="You May Also Like" products={related} />}

      <StickyAddToCartBar product={product} />
    </div>
  );
}
