import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessageModel from "@/lib/models/ContactMessage";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const { resolved } = await request.json();

  const message = await ContactMessageModel.findByIdAndUpdate(
    id,
    { $set: { resolved } },
    { new: true, runValidators: true }
  );

  if (!message) {
    return NextResponse.json({ success: false, message: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: message });
}
