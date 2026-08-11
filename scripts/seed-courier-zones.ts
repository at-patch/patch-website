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

type Zone = "ASIA" | "MIDDLE_EAST" | "USA_CANADA" | "EUROPE_D" | "EUROPE_E" | "UK" | "JAPAN";
type Class = "premium" | "express" | "economy";

// One entry per data column, in the exact left-to-right order they appear on the
// "Master Courier Rates" sheet tab (Consolidated_Courier_Rates, columns B-T).
const COLUMNS: Array<{ zone: Zone; courierClass: Class }> = [
  { zone: "ASIA", courierClass: "premium" },
  { zone: "ASIA", courierClass: "express" },
  { zone: "MIDDLE_EAST", courierClass: "premium" },
  { zone: "MIDDLE_EAST", courierClass: "express" },
  { zone: "MIDDLE_EAST", courierClass: "economy" },
  { zone: "USA_CANADA", courierClass: "premium" },
  { zone: "USA_CANADA", courierClass: "express" },
  { zone: "USA_CANADA", courierClass: "economy" },
  { zone: "EUROPE_D", courierClass: "premium" },
  { zone: "EUROPE_D", courierClass: "express" },
  { zone: "EUROPE_D", courierClass: "economy" },
  { zone: "EUROPE_E", courierClass: "premium" },
  { zone: "EUROPE_E", courierClass: "express" },
  { zone: "EUROPE_E", courierClass: "economy" },
  { zone: "UK", courierClass: "premium" },
  { zone: "UK", courierClass: "express" },
  { zone: "UK", courierClass: "economy" },
  { zone: "JAPAN", courierClass: "premium" },
  { zone: "JAPAN", courierClass: "express" },
];

// Row metadata mirrors src/lib/courier-shipping.ts FLAT_WEIGHT_STEPS_KG / PER_KG_BANDS.
const ROWS: Array<{ minWeightKg: number; maxWeightKg: number; pricingType: "flat" | "per_kg"; isDocument?: boolean }> = [
  { minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", isDocument: true },
  { minWeightKg: 1.0, maxWeightKg: 1.0, pricingType: "flat", isDocument: true },
  ...[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map(
    (w) => ({ minWeightKg: w, maxWeightKg: w, pricingType: "flat" as const })
  ),
  { minWeightKg: 11, maxWeightKg: 15, pricingType: "per_kg" },
  { minWeightKg: 16, maxWeightKg: 20, pricingType: "per_kg" },
  { minWeightKg: 21, maxWeightKg: 30, pricingType: "per_kg" },
  { minWeightKg: 31, maxWeightKg: 40, pricingType: "per_kg" },
  { minWeightKg: 41, maxWeightKg: 50, pricingType: "per_kg" },
  { minWeightKg: 51, maxWeightKg: 70, pricingType: "per_kg" },
  { minWeightKg: 71, maxWeightKg: 300, pricingType: "per_kg" },
  { minWeightKg: 301, maxWeightKg: 500, pricingType: "per_kg" },
  { minWeightKg: 501, maxWeightKg: 1000, pricingType: "per_kg" },
];

// Raw cell text exactly as extracted from the "Master Courier Rates" sheet DOM,
// row by row (0.5 Kg Document ... 501-1000 Kg), 19 columns matching COLUMNS above.
// Empty string = no rate offered for that class/weight (e.g. Middle East Economy under 41kg).
const RAW_ROWS: string[][] = [
  ["4500","2900","4200","2600","","4700","3900","3600","4600","4200","3200","4600","4400","4200","4600","4200","3200","4700","2900"],
  ["5900","3500","4900","3200","","5800","4800","4400","5800","4900","3900","5800","5200","4950","5800","4900","3700","5900","3400 (Student 3060)"],
  ["5500","2800","5200","2800","","5100","4500","3500","5100","4700","3200","5100","4900","4100","5100","4700","2950","5750","3300"],
  ["6900","3600","5900","3300","","6400","5500","4200","6300","5400","3900","6300","5650","4850","6300","5400","3600","6600","3900"],
  ["8200","4200","6900","3900","","7500","6500","4900","7300","6400","4550","7300","6400","5550","7300","6400","3950","7850","4500"],
  ["9500","4700","7900","4300","","8700","7400","5900","8400","7400","5200","8400","7300","6300","8400","7400","4800","8950","4990"],
  ["10500","5400","8500","4900","","9500","8300","6500","9300","7990","5850","9300","8200","7050","9300","7990","5400","10250","5550"],
  ["11200","5800","8900","5500","","10500","9200","7300","10300","8990","6500","10300","8950","7800","10300","8990","5950","11250","6100"],
  ["11900","6400","9700","5900","","11500","10300","7900","11300","9990","7150","11300","9600","8500","11300","9990","6500","12250","6650"],
  ["13200","6900","10700","6500","","12500","11400","8500","11990","10600","7800","11990","10300","9200","11990","10600","7200","13500","7200"],
  ["13900","7500","11300","6900","","13500","12300","9200","12950","11500","8450","12950","10900","9900","12950","11500","7900","14500","7750"],
  ["15500","8500","12200","7800","","14900","12900","9900","14500","12400","9100","14500","11900","10900","14500","12400","8500","15700","8300"],
  ["15900","8900","12900","8300","","15900","13900","10500","15500","12900","9750","15500","12700","11650","15500","12900","8950","16900","8800"],
  ["17200","9200","13500","8900","","16900","14900","11300","16500","13500","10400","16500","13500","12400","16500","13500","9500","18100","9300"],
  ["18200","9600","14200","9200","","17900","15700","11900","17500","14400","11050","17500","14000","13150","17500","14400","10200","19300","9800"],
  ["18900","10400","14900","9600","","18900","16800","12500","18500","14500","11700","18500","14500","13900","18500","14500","10600","20500","10300"],
  ["19200","10900","15500","10200","","19900","19300","13200","19500","14900","12350","19500","14900","14650","19500","14900","11200","21700","10700"],
  ["20700","11200","16500","10500","","20900","18500","13900","20500","15500","13000","20500","15500","15400","20500","15500","11600","22900","11100"],
  ["21900","11700","17500","10900","","21900","19500","14500","21500","15900","13650","21500","15900","16150","21500","15900","12200","23900","11500"],
  ["22900","12300","17900","11400","","22900","20500","15200","21900","16500","14300","21900","16700","16500","21900","16500","12800","24900","11900"],
  ["24900","12600","18500","11900","","24200","21300","15900","22900","16900","14950","22900","17400","17500","22900","16900","13200","25900","12300"],
  ["26900","12900","18900","12400","","24900","21900","16400","23900","17500","15600","23900","17900","17900","23900","17500","13800","26700","12900"],
  ["2650 (Per Kg)","1390 (Per Kg)","1850 (Per Kg)","1090 (Per Kg)","","2480 (Per Kg)","1690 (Per Kg)","1590 (Per Kg)","2350 (Per Kg)","1290 (Per Kg)","1460 (Per Kg)","2350 (Per Kg)","1290 (Per Kg)","1760 (Per Kg)","2350 (Per Kg)","1290 (Per Kg)","1190 (Per Kg)","2590 (Per Kg)","1240 (Per Kg)"],
  ["2550","1260","1690","1070","","2350","1650","1540","2190","1250","1360","2190","1250","1650","2190","1250","1150","2490","1150"],
  ["2150","1060","1580","790","","2290","1370","1290","2090","1070","1250","2090","1070","1380","2090","1070","890","2380","1120"],
  ["1450","1050","1220","750","","2250","1250 (U)","1190 Offer","1750","990","1140","1750","980","1190","1750","990","880","1680","1070"],
  ["1390","990","1190","720","420","2220","1190 (U)","1170","1680","940","1090","1680","930","1140","1680","940","860","1660","1030"],
  ["1350","950","1190","720","420","2190","1180","1140","1630","900","1060","1630","900","1120","1630","900","850","1640","1010"],
  ["1290","920","1170","720","390","2170","1150","970","1590","860","1030","1590","870","1090","1590","860","840","1620","980"],
  ["1250","910","1150","710","350","2150","1140","920","1550","850","980","1550","830","1040","1550","850","830","1600","980"],
  ["1230","900","1140","690","330","2130","1130","890","1500","840","950","1500","810","995","1500","840","820","1600","970"],
];

// Cells with unexplained annotations, resolved to their plain numeric value per
// business decision: take the leading number, ignore the parenthetical/suffix.
const CELL_OVERRIDES: Record<string, number> = {
  "1:18": 3400, // Japan, 1.0 Kg Document, Express: "3400 (Student 3060)"
  "26:6": 1250, // USA-Canada, 31-40 Kg, Express: "1250 (U)"
  "26:7": 1190, // USA-Canada, 31-40 Kg, Economy: "1190 Offer"
  "27:6": 1190, // USA-Canada, 41-50 Kg, Express: "1190 (U)"
};

const ZONE_META: Record<Zone, { name: string; countries: Array<{ code: string; name: string }> }> = {
  ASIA: {
    name: "ASIA",
    countries: [
      { code: "BN", name: "Brunei" },
      { code: "BT", name: "Bhutan" },
      { code: "KH", name: "Cambodia" },
      { code: "CN", name: "China" },
      { code: "HK", name: "Hong Kong" },
      { code: "IN", name: "India" },
      { code: "ID", name: "Indonesia" },
      { code: "LA", name: "Laos" },
      { code: "MO", name: "Macau" },
      { code: "MY", name: "Malaysia" },
      { code: "MV", name: "Maldives" },
      { code: "MN", name: "Mongolia" },
      { code: "MM", name: "Myanmar" },
      { code: "NP", name: "Nepal" },
      { code: "PK", name: "Pakistan" },
      { code: "PH", name: "Philippines" },
      { code: "SG", name: "Singapore" },
      { code: "KR", name: "South Korea" },
      { code: "LK", name: "Sri Lanka" },
      { code: "TW", name: "Taiwan" },
      { code: "TH", name: "Thailand" },
      { code: "VN", name: "Vietnam" },
    ],
  },
  MIDDLE_EAST: {
    name: "MIDDLE EAST",
    countries: [
      { code: "BH", name: "Bahrain" },
      { code: "JO", name: "Jordan" },
      { code: "KW", name: "Kuwait" },
      { code: "LB", name: "Lebanon" },
      { code: "OM", name: "Oman" },
      { code: "QA", name: "Qatar" },
      { code: "SA", name: "Saudi Arabia" },
      { code: "AE", name: "United Arab Emirates" },
    ],
  },
  USA_CANADA: {
    name: "USA-CANADA",
    countries: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
    ],
  },
  EUROPE_D: {
    name: "EUROPE (D) ZONE",
    countries: [
      { code: "AT", name: "Austria" },
      { code: "BE", name: "Belgium" },
      { code: "FR", name: "France" },
      { code: "DE", name: "Germany" },
      { code: "IT", name: "Italy" },
      { code: "LU", name: "Luxembourg" },
      { code: "NL", name: "Netherlands" },
      { code: "ES", name: "Spain" },
    ],
  },
  EUROPE_E: {
    name: "EUROPE E ZONE",
    countries: [
      { code: "BG", name: "Bulgaria" },
      { code: "HR", name: "Croatia" },
      { code: "CZ", name: "Czech Republic" },
      { code: "DK", name: "Denmark" },
      { code: "EE", name: "Estonia" },
      { code: "FI", name: "Finland" },
      { code: "GR", name: "Greece" },
      { code: "HU", name: "Hungary" },
      { code: "IE", name: "Ireland" },
      { code: "LV", name: "Latvia" },
      { code: "LT", name: "Lithuania" },
      { code: "NO", name: "Norway" },
      { code: "PL", name: "Poland" },
      { code: "PT", name: "Portugal" },
      { code: "RO", name: "Romania" },
      { code: "SK", name: "Slovakia" },
      { code: "SI", name: "Slovenia" },
      { code: "SE", name: "Sweden" },
      { code: "CH", name: "Switzerland" },
    ],
  },
  UK: { name: "UK", countries: [{ code: "GB", name: "United Kingdom" }] },
  JAPAN: { name: "JAPAN", countries: [{ code: "JP", name: "Japan" }] },
};

// A country may belong to exactly one zone: resolveInternationalCourierShipping
// looks a destination up with findOne({ "countries.code": X }), so a duplicate
// would price that country from whichever zone Mongo happened to return.
function assertNoDuplicateCountries() {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const [zone, meta] of Object.entries(ZONE_META) as Array<[Zone, (typeof ZONE_META)[Zone]]>) {
    for (const country of meta.countries) {
      const owner = seen.get(country.code);
      if (owner) duplicates.push(`${country.code} in both "${owner}" and "${ZONE_META[zone].name}"`);
      else seen.set(country.code, ZONE_META[zone].name);
    }
  }
  if (duplicates.length > 0) {
    throw new Error(`Country assigned to more than one courier zone:\n  ${duplicates.join("\n  ")}`);
  }
  return seen.size;
}

function parseCell(raw: string, rowIndex: number, colIndex: number): number | null {
  if (raw === "") return null;
  const overrideKey = `${rowIndex}:${colIndex}`;
  if (overrideKey in CELL_OVERRIDES) return CELL_OVERRIDES[overrideKey];
  const match = raw.match(/-?\d+(\.\d+)?/);
  if (!match) throw new Error(`Unparseable rate cell "${raw}" at row ${rowIndex}, col ${colIndex}`);
  return Number(match[0]);
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  const { connectToDatabase } = await import("@/lib/db");
  const { default: CourierZoneModel } = await import("@/lib/models/CourierZone");
  await connectToDatabase();

  const apply = process.argv.includes("--apply");
  const countryCount = assertNoDuplicateCountries();
  const ratesByZone = new Map<Zone, Array<{ courierClass: Class; minWeightKg: number; maxWeightKg: number; pricingType: "flat" | "per_kg"; rate: number; isDocument: boolean }>>();

  RAW_ROWS.forEach((row, rowIndex) => {
    const rowMeta = ROWS[rowIndex];
    row.forEach((cell, colIndex) => {
      const column = COLUMNS[colIndex];
      const rate = parseCell(cell, rowIndex, colIndex);
      if (rate === null) return;
      const list = ratesByZone.get(column.zone) ?? [];
      list.push({
        courierClass: column.courierClass,
        minWeightKg: rowMeta.minWeightKg,
        maxWeightKg: rowMeta.maxWeightKg,
        pricingType: rowMeta.pricingType,
        rate,
        isDocument: Boolean(rowMeta.isDocument),
      });
      ratesByZone.set(column.zone, list);
    });
  });

  const report = Array.from(ratesByZone.entries()).map(([zone, rates]) => ({
    zone: ZONE_META[zone].name,
    countries: ZONE_META[zone].countries.length,
    rateCount: rates.length,
  }));

  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", countries: countryCount, zones: report }, null, 2));
    console.log("Dry run only. Re-run with --apply to write CourierZone documents.");
    return;
  }

  const operations = Array.from(ratesByZone.entries()).map(([zone, rates]) => ({
    updateOne: {
      filter: { name: ZONE_META[zone].name },
      update: {
        $set: {
          name: ZONE_META[zone].name,
          countries: ZONE_META[zone].countries,
          currency: "BDT",
          isActive: true,
          rates,
        },
      },
      upsert: true,
    },
  }));

  const result = await CourierZoneModel.bulkWrite(operations, { ordered: false });
  console.log(JSON.stringify({ mode: "apply", countries: countryCount, zones: report, upserted: result.upsertedCount, modified: result.modifiedCount }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
