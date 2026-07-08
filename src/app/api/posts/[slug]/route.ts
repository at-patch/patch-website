import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectToDatabase();
  const { slug } = await params;

  const post = await PostModel.findOne({ slug, published: true });
  if (!post) {
    return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: post });
}
