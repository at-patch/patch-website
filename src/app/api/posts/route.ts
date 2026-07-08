import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "9");

  const filter: Record<string, unknown> = { published: true };
  if (category) filter.category = category;

  const [items, total] = await Promise.all([
    PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PostModel.countDocuments(filter),
  ]);

  return NextResponse.json({ success: true, data: items, total, page, limit });
}
