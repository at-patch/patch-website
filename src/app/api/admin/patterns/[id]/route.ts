import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PatternModel from "@/lib/models/Pattern";
import { requireAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { patternUpdateSchema } from "@/lib/validation/admin-material.schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, patternUpdateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const { id } = await params;

  try {
    const pattern = await PatternModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });
    if (!pattern) return NextResponse.json({ success: false, message: "Pattern not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: pattern });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update pattern.";
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

  const pattern = await PatternModel.findByIdAndDelete(id);
  if (!pattern) return NextResponse.json({ success: false, message: "Pattern not found." }, { status: 404 });
  return NextResponse.json({ success: true, data: null });
}
