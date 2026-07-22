import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingCityModel from "@/lib/models/ShippingCity";
import { requireAdmin } from "@/lib/require-admin";
import { slugifyCity } from "@/lib/shipping-cities";
import { parseJsonBody } from "@/lib/validation";
import { shippingCityUpdateSchema } from "@/lib/validation/admin-material.schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, shippingCityUpdateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const { id } = await params;
  const update = {
    ...parsed.data,
    ...(parsed.data.name ? { slug: slugifyCity(parsed.data.name) } : {}),
  };

  try {
    const city = await ShippingCityModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!city) return NextResponse.json({ success: false, message: "City not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: city });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update city.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const city = await ShippingCityModel.findByIdAndDelete(id);
  if (!city) return NextResponse.json({ success: false, message: "City not found." }, { status: 404 });
  return NextResponse.json({ success: true, data: null });
}
