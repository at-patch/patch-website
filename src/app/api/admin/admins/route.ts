import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AdminModel from "@/lib/models/Admin";
import { requireOwnerAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { createAdminSchema } from "@/lib/validation/admin.schemas";

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Owner access required. Log in again if your role was just upgraded." },
  { status: 403 }
);

export async function GET(request: NextRequest) {
  const owner = await requireOwnerAdmin(request);
  if (!owner) return FORBIDDEN;

  await connectToDatabase();
  const items = await AdminModel.find({}).select("-passwordHash").sort({ createdAt: 1 });
  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}

export async function POST(request: NextRequest) {
  const owner = await requireOwnerAdmin(request);
  if (!owner) return FORBIDDEN;

  const parsed = await parseJsonBody(request, createAdminSchema);
  if (!parsed.success) return parsed.response;
  const { name, email, password, role } = parsed.data;

  await connectToDatabase();

  const existing = await AdminModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { success: false, message: "An admin with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await AdminModel.create({ name, email, passwordHash, role, active: true });
  const admin = await AdminModel.findById(created._id).select("-passwordHash");

  return NextResponse.json({ success: true, data: admin }, { status: 201 });
}
