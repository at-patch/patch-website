/**
 * Development seed for the /admin/orders tab triage (O7 acceptance).
 *
 * Plants one order in every interesting position relative to the bucket contract in
 * `src/lib/order-buckets.ts`, including both sides of the SLA boundary, so the four
 * tabs can be checked by eye against a known expected distribution.
 *
 * This is NOT production data. Every seeded order carries the `SEED-BUCKET-` prefix
 * so it can be found and removed again.
 *
 * Safety rules:
 *  - Dry run by default; `--apply` is required to write.
 *  - `--clean` removes previously seeded bucket orders (also requires `--apply`).
 *  - Only ever touches orders whose orderNumber starts with SEED-BUCKET-.
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

const SEED_PREFIX = "SEED-BUCKET-";
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

type Seed = {
  slug: string;
  status: string;
  paymentStatus: string;
  ageMs: number;
  /** What the bucket contract should do with this order, and why it is here. */
  expect: string;
  note: string;
};

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const apply = process.argv.includes("--apply");
  const clean = process.argv.includes("--clean");

  const [{ connectToDatabase }, { default: OrderModel }, { default: ProductModel }, buckets, { Types }] =
    await Promise.all([
      import("@/lib/db"),
      import("@/lib/models/Order"),
      import("@/lib/models/Product"),
      import("@/lib/order-buckets"),
      import("mongoose"),
    ]);

  const { OVERDUE_AFTER_DAYS, bucketOf } = buckets;

  const seeds: Seed[] = [
    {
      slug: "fresh-paid",
      status: "placed",
      paymentStatus: "paid",
      ageMs: DAY_MS,
      expect: "pending",
      note: "Inside the SLA window.",
    },
    {
      slug: "unpaid-ancient",
      status: "placed",
      paymentStatus: "pending",
      ageMs: 30 * DAY_MS,
      expect: "pending",
      note: "Unpaid is never overdue — abandoned checkout, not fulfillment debt.",
    },
    {
      slug: "shipped-ancient",
      status: "shipped",
      paymentStatus: "paid",
      ageMs: 20 * DAY_MS,
      expect: "pending",
      note: "Shipped settles the debt, however old the order is.",
    },
    {
      // Deliberately 6 hours inside the window rather than exactly on it: a fixture
      // seeded at precisely now-SLA is overdue seconds later, so it could never be
      // observed as Pending. The strict "exactly N days is not yet overdue" boundary
      // is pinned in src/lib/order-buckets.test.ts, where time can be frozen.
      slug: "inside-window-edge",
      status: "placed",
      paymentStatus: "paid",
      ageMs: OVERDUE_AFTER_DAYS * DAY_MS - 6 * 60 * 60 * 1000,
      expect: "pending",
      note: `6 hours short of ${OVERDUE_AFTER_DAYS} days — still inside the window (stays Pending for ~6h after seeding).`,
    },
    {
      slug: "boundary-just-past",
      status: "placed",
      paymentStatus: "paid",
      ageMs: OVERDUE_AFTER_DAYS * DAY_MS + MINUTE_MS,
      expect: "overdue",
      note: "One minute past the window.",
    },
    {
      slug: "overdue-deep",
      status: "processing",
      paymentStatus: "paid",
      ageMs: 9 * DAY_MS,
      expect: "overdue",
      note: "Should sort above boundary-just-past — Overdue is oldest-first.",
    },
    {
      slug: "delivered",
      status: "delivered",
      paymentStatus: "paid",
      ageMs: 12 * DAY_MS,
      expect: "completed",
      note: "Was late once; delivery wins.",
    },
    {
      slug: "cancelled",
      status: "cancelled",
      paymentStatus: "refunded",
      ageMs: 6 * DAY_MS,
      expect: "cancelled",
      note: "Was late once; cancellation wins.",
    },
  ];

  await connectToDatabase();

  if (clean) {
    const filter = { orderNumber: { $regex: `^${SEED_PREFIX}` } };
    const doomed = await OrderModel.countDocuments(filter);
    if (!apply) {
      console.log(`Dry run: --clean would delete ${doomed} seeded order(s). Re-run with --apply.`);
      return;
    }
    const result = await OrderModel.deleteMany(filter);
    console.log(`Deleted ${result.deletedCount} seeded order(s).`);
    return;
  }

  const now = new Date();
  const sample = await ProductModel.findOne({}, { _id: 1, name: 1, price: 1 }).lean();

  const docs = seeds.map((seed) => {
    const createdAt = new Date(now.getTime() - seed.ageMs);
    const price = 1200;
    return {
      orderNumber: `${SEED_PREFIX}${seed.slug.toUpperCase()}`,
      items: [
        {
          product: sample?._id ?? new Types.ObjectId(),
          sku: `SEED-${seed.slug}`,
          name: sample?.name ?? "Seeded patch tee",
          price,
          size: "M",
          color: "black",
        },
      ],
      subtotal: price,
      shippingCost: 80,
      total: price + 80,
      currency: "BDT",
      shippingAddress: {
        fullName: `Bucket Test ${seed.slug}`,
        phone: "+8801700000000",
        email: "bucket-seed@example.com",
        addressLine: "12 Test Road",
        city: "Dhaka",
        citySlug: "dhaka",
        countryCode: "BD",
        shippingCost: 80,
      },
      paymentMethod: "card",
      paymentStatus: seed.paymentStatus,
      status: seed.status,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const expectedCounts = seeds.reduce<Record<string, number>>((acc, seed) => {
    acc[seed.expect] = (acc[seed.expect] ?? 0) + 1;
    return acc;
  }, {});

  // Verify the seeds against the same function the API uses, so a broken expectation
  // is caught here rather than by squinting at the UI.
  const mismatches = seeds
    .map((seed) => {
      const actual = bucketOf(
        {
          status: seed.status as never,
          paymentStatus: seed.paymentStatus as never,
          createdAt: new Date(now.getTime() - seed.ageMs),
        },
        now
      );
      return actual === seed.expect ? null : `${seed.slug}: expected ${seed.expect}, got ${actual}`;
    })
    .filter(Boolean);

  const report = {
    orders: seeds.map((seed) => ({ orderNumber: `${SEED_PREFIX}${seed.slug.toUpperCase()}`, expect: seed.expect, note: seed.note })),
    expectedCounts,
    expectedTotal: seeds.length,
    mismatches,
  };

  if (mismatches.length > 0) {
    console.error(JSON.stringify(report, null, 2));
    throw new Error("Seed expectations disagree with bucketOf — fix the seed or the contract.");
  }

  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    console.log("\nDry run only. Re-run with --apply to write these orders.");
    return;
  }

  await OrderModel.deleteMany({ orderNumber: { $regex: `^${SEED_PREFIX}` } });
  // timestamps: false so the backdated createdAt survives instead of being
  // overwritten with now — the whole point of the fixture is its age.
  await OrderModel.insertMany(docs, { timestamps: false });

  console.log(JSON.stringify({ ...report, inserted: docs.length }, null, 2));
  console.log("\nOpen /admin/orders and confirm each tab count matches expectedCounts.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
