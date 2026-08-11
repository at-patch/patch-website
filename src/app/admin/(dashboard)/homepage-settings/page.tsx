"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { SectionPlacementEditor, type SectionRow } from "@/components/admin/SectionPlacementEditor";
import {
  Button,
  ErrorBanner,
  FormInput,
  FormTextarea,
  PageHeader,
} from "@/components/admin/ui";
import type { ApiListResponse, ApiResponse, HomepageSettings, ProductBatch } from "@/types";

const DEFAULT_PROMO = {
  eyebrow: "",
  title: "",
  body: "",
  ctaLabel: "",
  ctaHref: "",
};

function isBatch(value: HomepageSettings["productBatches"][number]["batch"]): value is ProductBatch {
  return Boolean(value && typeof value === "object" && "_id" in value);
}

function toRows(rows: HomepageSettings["productBatches"] | undefined): SectionRow[] {
  return (rows ?? [])
    .filter((row): row is HomepageSettings["productBatches"][number] & { batch: ProductBatch } =>
      isBatch(row.batch)
    )
    .sort((a, b) => a.order - b.order)
    .map((row, index) => ({ batch: row.batch, enabled: row.enabled, order: index }));
}

function toPayload(rows: SectionRow[]) {
  return rows.map((row, index) => ({ batch: row.batch._id, enabled: row.enabled, order: index }));
}

export default function HomepageSettingsPage() {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [homepageRows, setHomepageRows] = useState<SectionRow[]>([]);
  const [shopRows, setShopRows] = useState<SectionRow[]>([]);
  const [primaryPromo, setPrimaryPromo] = useState(DEFAULT_PROMO);
  const [secondaryPromo, setSecondaryPromo] = useState(DEFAULT_PROMO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: settingsResponse }, { data: batchesResponse }] = await Promise.all([
      axiosInstance.get<ApiResponse<HomepageSettings>>("/admin/homepage-settings"),
      axiosInstance.get<ApiListResponse<ProductBatch>>("/admin/product-batches"),
    ]);

    setHomepageRows(toRows(settingsResponse.data.productBatches));
    setShopRows(toRows(settingsResponse.data.shopBatches));
    setPrimaryPromo(settingsResponse.data.primaryPromo ?? {
      eyebrow: "New Drop",
      title: "Color-blocked, cut for confidence.",
      body: "Bold silhouettes and statement color, styled for how you actually move through your day.",
      ctaLabel: "Shop Now",
      ctaHref: "/shop",
    });
    setSecondaryPromo(settingsResponse.data.secondaryPromo ?? {
      eyebrow: "Made in Dhaka",
      title: "Every stitch, done by hand.",
      body: "Small studio team, careful finishing, a little less waste along the way — fashion that's made thoughtfully.",
      ctaLabel: "See the Process",
      ctaHref: "/story",
    });
    setBatches(batchesResponse.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch on mount
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data } = await axiosInstance.put<ApiResponse<HomepageSettings>>("/admin/homepage-settings", {
        primaryPromo,
        secondaryPromo,
        productBatches: toPayload(homepageRows),
        shopBatches: toPayload(shopRows),
      });
      setHomepageRows(toRows(data.data.productBatches));
      setShopRows(toRows(data.data.shopBatches));
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to save storefront settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Settings2}
        title="Storefront Settings"
        description="Edit homepage promo copy and choose which active product batches appear as carousel sections on the homepage and the Shop landing view."
        action={<Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-patch-line bg-patch-bg p-4">
          <p className="mb-4 text-sm font-semibold text-patch-ink">Primary promo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Eyebrow" value={primaryPromo.eyebrow} onChange={(v) => setPrimaryPromo({ ...primaryPromo, eyebrow: v })} required />
            <FormInput label="CTA label" value={primaryPromo.ctaLabel} onChange={(v) => setPrimaryPromo({ ...primaryPromo, ctaLabel: v })} required />
            <div className="sm:col-span-2">
              <FormInput label="Title" value={primaryPromo.title} onChange={(v) => setPrimaryPromo({ ...primaryPromo, title: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormTextarea label="Body" value={primaryPromo.body} onChange={(v) => setPrimaryPromo({ ...primaryPromo, body: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormInput label="CTA URL" value={primaryPromo.ctaHref} onChange={(v) => setPrimaryPromo({ ...primaryPromo, ctaHref: v })} required />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-patch-line bg-patch-bg p-4">
          <p className="mb-4 text-sm font-semibold text-patch-ink">Secondary promo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Eyebrow" value={secondaryPromo.eyebrow} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, eyebrow: v })} required />
            <FormInput label="CTA label" value={secondaryPromo.ctaLabel} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, ctaLabel: v })} required />
            <div className="sm:col-span-2">
              <FormInput label="Title" value={secondaryPromo.title} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, title: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormTextarea label="Body" value={secondaryPromo.body} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, body: v })} required />
            </div>
            <div className="sm:col-span-2">
              <FormInput label="CTA URL" value={secondaryPromo.ctaHref} onChange={(v) => setSecondaryPromo({ ...secondaryPromo, ctaHref: v })} required />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <SectionPlacementEditor
        title="Homepage sections"
        description="Carousel sections rendered on the editorial homepage at /home."
        batches={batches}
        rows={homepageRows}
        onChange={setHomepageRows}
        addLabel="Add to homepage"
        emptyDescription="Add active batches to publish product carousel sections on the homepage."
        loading={loading}
      />

      <SectionPlacementEditor
        title="Shop page sections"
        description="Carousel sections rendered above the Shop catalog — for example a curated “Top 10 Best Sellers”. These are hidden as soon as a visitor applies a search, filter, or sort."
        batches={batches}
        rows={shopRows}
        onChange={setShopRows}
        addLabel="Add to shop page"
        emptyDescription="Add active batches to feature curated sections above the Shop catalog."
        loading={loading}
      />
    </div>
  );
}
