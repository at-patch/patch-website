import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessageModel from "@/lib/models/ContactMessage";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const messages = await ContactMessageModel.find().sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: messages, total: messages.length });
}
