import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingZoneModel from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/require-admin";
import { slugifyCity } from "@/lib/shipping-cities";
import { parseJsonBody } from "@/lib/validation";
import { shippingZoneUpdateSchema } from "@/lib/validation/admin-material.schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, shippingZoneUpdateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const { id } = await params;
  const update = {
    ...parsed.data,
    ...(parsed.data.countryCode ? { countryCode: parsed.data.countryCode.toUpperCase() } : {}),
    ...(parsed.data.currency ? { currency: parsed.data.currency.toUpperCase() } : {}),
    ...(parsed.data.district !== undefined
      ? { districtSlug: parsed.data.district ? slugifyCity(parsed.data.district) : "" }
      : {}),
  };

  try {
    const zone = await ShippingZoneModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!zone) return NextResponse.json({ success: false, message: "Shipping rule not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: zone });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update shipping rule.";
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
  const zone = await ShippingZoneModel.findByIdAndDelete(id);
  if (!zone) return NextResponse.json({ success: false, message: "Shipping rule not found." }, { status: 404 });
  return NextResponse.json({ success: true, data: null });
}
