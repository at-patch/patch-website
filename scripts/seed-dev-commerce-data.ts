/**
 * Development seed for the data that F0/F1/F2 need in order to be exercised
 * end to end: product weights, Bangladesh district shipping zones, and a small
 * set of international country zones.
 *
 * This is NOT the production migration — that is `pnpm migrate:shipping`, which
 * maps real legacy city records. Use this to make a test database checkout-ready.
 *
 * Safety rules:
 *  - Dry run by default; `--apply` is required to write.
 *  - Product weights are only filled where missing/invalid, so values edited later
 *    by the client are never overwritten.
 *  - Shipping zones upsert with $setOnInsert, so hand-tuned rates survive a re-run.
 *    Pass `--reset-rates` to force existing zone rates back to these defaults.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(name: string) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

/**
 * Chosen to straddle the chargeable-weight boundaries so test carts exercise the
 * `max(1, ceil(kg))` rule: one tee (0.25) hits the 1 kg minimum, a jacket plus
 * trousers (1.8) rounds to 2 kg, three jackets (3.6) rounds to 4 kg.
 */
const CATEGORY_WEIGHTS_KG: Record<string, number> = {
  outerwear: 1.2,
  bottoms: 0.6,
  dresses: 0.45,
  tops: 0.25,
  accessories: 0.15,
};
const FALLBACK_WEIGHT_KG = 0.5;

const DHAKA_BASE_RATE = 80;
const DISTRICT_BASE_RATE = 120;
const DISTRICT_ADDITIONAL_KG_RATE = 50;

/**
 * Rates are held in BDT on purpose: order creation rejects any shipping rule whose
 * currency is not BDT until the F1 currency contract covers shipping rules, so a
 * non-BDT zone would fail checkout rather than convert.
 */
const INTERNATIONAL_ZONES = [
  { countryCode: "US", countryName: "United States", baseRate: 2500, additionalKgRate: 1800 },
  { countryCode: "GB", countryName: "United Kingdom", baseRate: 2200, additionalKgRate: 1600 },
  { countryCode: "DE", countryName: "Germany", baseRate: 2200, additionalKgRate: 1600 },
  { countryCode: "CN", countryName: "China", baseRate: 1500, additionalKgRate: 900 },
];

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const [
    { connectToDatabase },
    { default: ProductModel },
    { default: ShippingZoneModel },
    { BANGLADESH_DISTRICTS, slugifyCity },
  ] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/models/Product"),
    import("@/lib/models/ShippingZone"),
    import("@/lib/shipping-cities"),
  ]);

  const apply = process.argv.includes("--apply");
  const resetRates = process.argv.includes("--reset-rates");

  await connectToDatabase();

  const missingWeightFilter = {
    $or: [{ weightKg: { $exists: false } }, { weightKg: null }, { weightKg: { $lte: 0 } }],
  };

  const productsMissingWeight = await ProductModel.find(missingWeightFilter)
    .select("name category")
    .lean<Array<{ _id: unknown; name: string; category?: string }>>();

  const weightPlan = productsMissingWeight.map((product) => ({
    id: String(product._id),
    name: product.name,
    category: product.category ?? "(none)",
    weightKg: CATEGORY_WEIGHTS_KG[(product.category ?? "").toLowerCase()] ?? FALLBACK_WEIGHT_KG,
  }));

  const districtZones = BANGLADESH_DISTRICTS.map((district) => ({
    countryCode: "BD",
    countryName: "Bangladesh",
    scope: "district" as const,
    district: district.name,
    districtSlug: slugifyCity(district.name),
    baseRate: district.name === "Dhaka" ? DHAKA_BASE_RATE : DISTRICT_BASE_RATE,
    additionalKgRate: DISTRICT_ADDITIONAL_KG_RATE,
    currency: "BDT",
    isActive: true,
  }));

  const countryZones = INTERNATIONAL_ZONES.map((zone) => ({
    ...zone,
    scope: "country" as const,
    district: "",
    districtSlug: "",
    currency: "BDT",
    isActive: true,
  }));

  const allZones = [...districtZones, ...countryZones];

  const report = {
    mode: apply ? "apply" : "dry-run",
    resetRates,
    productsMissingWeight: weightPlan.length,
    weightPlan,
    districtZones: districtZones.length,
    countryZones: countryZones.map((zone) => `${zone.countryName} (${zone.baseRate} + ${zone.additionalKgRate}/kg BDT)`),
  };

  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    console.log("\nDry run only. Re-run with --apply to write these values.");
    return;
  }

  let productsUpdated = 0;
  for (const entry of weightPlan) {
    const result = await ProductModel.updateOne(
      { _id: entry.id, ...missingWeightFilter },
      { $set: { weightKg: entry.weightKg } }
    );
    productsUpdated += result.modifiedCount;
  }

  const zoneResult = await ShippingZoneModel.bulkWrite(
    allZones.map((zone) => ({
      updateOne: {
        filter: { countryCode: zone.countryCode, scope: zone.scope, districtSlug: zone.districtSlug },
        update: resetRates ? { $set: zone } : { $setOnInsert: zone },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  console.log(JSON.stringify({
    ...report,
    productsUpdated,
    zonesInserted: zoneResult.upsertedCount,
    zonesUpdated: zoneResult.modifiedCount,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
