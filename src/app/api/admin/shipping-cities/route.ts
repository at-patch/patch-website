import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingCityModel from "@/lib/models/ShippingCity";
import { requireAdmin } from "@/lib/require-admin";
import { BANGLADESH_DISTRICTS, slugifyCity } from "@/lib/shipping-cities";
import { parseJsonBody } from "@/lib/validation";
import { shippingCityCreateSchema } from "@/lib/validation/admin-material.schemas";

const DEFAULT_DHAKA_COST = 80;
const DEFAULT_NATIONWIDE_COST = 120;

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const cities = await ShippingCityModel.find({}).sort({ name: 1 });
  return NextResponse.json({ success: true, data: cities, total: cities.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, shippingCityCreateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();

  try {
    const city = await ShippingCityModel.create({
      ...parsed.data,
      slug: slugifyCity(parsed.data.name),
      isActive: parsed.data.isActive ?? true,
    });
    return NextResponse.json({ success: true, data: city }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create city.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();

  const existing = await ShippingCityModel.countDocuments({});
  if (existing > 0) {
    return NextResponse.json({ success: false, message: "Shipping cities are already seeded." }, { status: 409 });
  }

  const docs = BANGLADESH_DISTRICTS.map((city) => ({
    ...city,
    slug: slugifyCity(city.name),
    shippingCost: city.name === "Dhaka" ? DEFAULT_DHAKA_COST : DEFAULT_NATIONWIDE_COST,
    isActive: true,
  }));
  const cities = await ShippingCityModel.insertMany(docs);
  return NextResponse.json({ success: true, data: cities, total: cities.length }, { status: 201 });
}
