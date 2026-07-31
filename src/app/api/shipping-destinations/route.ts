import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { listActiveShippingDestinations } from "@/lib/shipping-quote";

export async function GET() {
  await connectToDatabase();
  const destinations = await listActiveShippingDestinations();
  return NextResponse.json({
    success: true,
    data: destinations,
    total: destinations.length,
  });
}
