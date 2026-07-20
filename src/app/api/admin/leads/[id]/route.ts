import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LeadModel from "@/lib/models/Lead";
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

  try {
    const lead = await LeadModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!lead) {
      return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const lead = await LeadModel.findByIdAndDelete(id);
  if (!lead) {
    return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
