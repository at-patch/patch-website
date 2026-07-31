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

function numericArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`--${name} must be a non-negative number.`);
  }
  return value;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const [
    { connectToDatabase },
    { default: ProductModel },
    { default: ShippingCityModel },
    { default: ShippingZoneModel },
    { BANGLADESH_DISTRICTS, slugifyCity },
  ] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/models/Product"),
    import("@/lib/models/ShippingCity"),
    import("@/lib/models/ShippingZone"),
    import("@/lib/shipping-cities"),
  ]);

  const apply = process.argv.includes("--apply");
  const defaultWeightKg = numericArg("default-weight-kg", 0.5);
  const defaultAdditionalKgRate = numericArg("additional-kg-rate", 50);

  await connectToDatabase();

  const missingWeightFilter = {
    $or: [
      { weightKg: { $exists: false } },
      { weightKg: null },
      { weightKg: { $lte: 0 } },
    ],
  };
  const [productsMissingWeight, cities] = await Promise.all([
    ProductModel.countDocuments(missingWeightFilter),
    ShippingCityModel.find({}).lean(),
  ]);

  const canonicalDistricts = new Map(
    BANGLADESH_DISTRICTS.map((district) => [slugifyCity(district.name), district])
  );
  const mappedCities = cities.flatMap((city) => {
    const district = canonicalDistricts.get(city.slug || slugifyCity(city.name));
    if (!district) return [];
    return [{
      cityId: String(city._id),
      district,
      baseRate: city.shippingCost,
      isActive: city.isActive,
    }];
  });
  const unmappedCities = cities
    .filter((city) => !canonicalDistricts.has(city.slug || slugifyCity(city.name)))
    .map((city) => ({ id: String(city._id), name: city.name, slug: city.slug }));

  const report = {
    mode: apply ? "apply" : "dry-run",
    defaults: { defaultWeightKg, defaultAdditionalKgRate },
    productsMissingWeight,
    legacyCities: cities.length,
    mappedCities: mappedCities.length,
    unmappedCities,
  };

  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    console.log("Dry run only. Re-run with --apply after reviewing defaults and unmapped cities.");
    return;
  }

  const productResult = await ProductModel.updateMany(
    missingWeightFilter,
    { $set: { weightKg: defaultWeightKg } }
  );

  if (mappedCities.length > 0) {
    await ShippingZoneModel.bulkWrite(
      mappedCities.map(({ district, baseRate, isActive }) => ({
        updateOne: {
          filter: {
            countryCode: "BD",
            scope: "district",
            districtSlug: slugifyCity(district.name),
          },
          update: {
            $setOnInsert: {
              countryCode: "BD",
              countryName: "Bangladesh",
              scope: "district",
              district: district.name,
              districtSlug: slugifyCity(district.name),
              baseRate,
              additionalKgRate: defaultAdditionalKgRate,
              currency: "BDT",
              isActive,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  console.log(JSON.stringify({
    ...report,
    productsUpdated: productResult.modifiedCount,
    shippingZonesUpsertedFromCities: mappedCities.length,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
