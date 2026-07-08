import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PostModel from "@/lib/models/Post";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const post = await PostModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!post) return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });

  return NextResponse.json({ success: true, data: post });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const post = await PostModel.findByIdAndDelete(id);
  if (!post) return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });

  return NextResponse.json({ success: true, data: null });
}
