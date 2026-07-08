import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const posts = await PostModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: posts, total: posts.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const post = await PostModel.create(body);
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
