import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingCityModel from "@/lib/models/ShippingCity";

export async function GET() {
  await connectToDatabase();
  const cities = await ShippingCityModel.find({ isActive: true }).sort({ name: 1 });
  return NextResponse.json({ success: true, data: cities, total: cities.length });
}
