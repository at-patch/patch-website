import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingZoneModel from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/require-admin";
import { BANGLADESH_DISTRICTS, slugifyCity } from "@/lib/shipping-cities";
import { parseJsonBody } from "@/lib/validation";
import { shippingZoneCreateSchema } from "@/lib/validation/admin-material.schemas";

const DEFAULT_DHAKA_BASE_RATE = 80;
const DEFAULT_NATIONWIDE_BASE_RATE = 120;
const DEFAULT_DHAKA_ADDITIONAL_RATE = 30;
const DEFAULT_NATIONWIDE_ADDITIONAL_RATE = 50;

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const zones = await ShippingZoneModel.find({}).sort({ countryName: 1, district: 1 });
  return NextResponse.json({ success: true, data: zones, total: zones.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, shippingZoneCreateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const district = parsed.data.scope === "district" ? parsed.data.district?.trim() ?? "" : "";

  try {
    const zone = await ShippingZoneModel.create({
      ...parsed.data,
      countryCode: parsed.data.countryCode.toUpperCase(),
      currency: parsed.data.currency.toUpperCase(),
      district,
      districtSlug: district ? slugifyCity(district) : "",
      isActive: parsed.data.isActive ?? true,
    });
    return NextResponse.json({ success: true, data: zone }, { status: 201 });
  } catch (error) {
    const message =
      (error as { code?: number }).code === 11000
        ? "A shipping rule already exists for this destination."
        : error instanceof Error
          ? error.message
          : "Failed to create shipping rule.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const operations = BANGLADESH_DISTRICTS.map(({ name }) => ({
    updateOne: {
      filter: { countryCode: "BD", scope: "district", districtSlug: slugifyCity(name) },
      update: {
        $setOnInsert: {
          countryCode: "BD",
          countryName: "Bangladesh",
          scope: "district",
          district: name,
          districtSlug: slugifyCity(name),
          baseRate: name === "Dhaka" ? DEFAULT_DHAKA_BASE_RATE : DEFAULT_NATIONWIDE_BASE_RATE,
          additionalKgRate:
            name === "Dhaka" ? DEFAULT_DHAKA_ADDITIONAL_RATE : DEFAULT_NATIONWIDE_ADDITIONAL_RATE,
          currency: "BDT",
          isActive: true,
        },
      },
      upsert: true,
    },
  }));

  await ShippingZoneModel.bulkWrite(operations, { ordered: false });
  const zones = await ShippingZoneModel.find({ countryCode: "BD", scope: "district" }).sort({ district: 1 });
  return NextResponse.json({ success: true, data: zones, total: zones.length });
}
