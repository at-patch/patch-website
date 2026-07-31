import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { quoteShippingForProducts } from "@/lib/shipping-quote";
import { parseJsonBody } from "@/lib/validation";
import { shippingQuoteSchema } from "@/lib/validation/order.schemas";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, shippingQuoteSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  try {
    const quote = await quoteShippingForProducts(parsed.data.productIds, {
      countryCode: parsed.data.countryCode,
      districtSlug: parsed.data.districtSlug,
    });
    if (!quote) {
      return NextResponse.json(
        { success: false, message: "Shipping is not available for this destination." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate shipping.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
