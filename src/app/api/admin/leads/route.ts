import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LeadModel from "@/lib/models/Lead";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const items = await LeadModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}
