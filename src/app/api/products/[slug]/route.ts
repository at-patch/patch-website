import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectToDatabase();
  const { slug } = await params;

  const product = await ProductModel.findOne({ slug });
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}
