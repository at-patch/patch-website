import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AdminModel from "@/lib/models/Admin";
import { requireOwnerAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { updateAdminSchema } from "@/lib/validation/admin.schemas";

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Owner access required. Log in again if your role was just upgraded." },
  { status: 403 }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await requireOwnerAdmin(request);
  if (!owner) return FORBIDDEN;

  const parsed = await parseJsonBody(request, updateAdminSchema);
  if (!parsed.success) return parsed.response;

  const { id } = await params;

  // An owner can't demote or deactivate themselves — that would leave the
  // store without anyone able to manage admins.
  if (id === owner.sub && (parsed.data.role === "staff" || parsed.data.active === false)) {
    return NextResponse.json(
      { success: false, message: "You can't remove your own owner access." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  try {
    const admin = await AdminModel.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true }).select(
      "-passwordHash"
    );
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update admin.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await requireOwnerAdmin(request);
  if (!owner) return FORBIDDEN;

  const { id } = await params;
  if (id === owner.sub) {
    return NextResponse.json({ success: false, message: "You can't delete your own account." }, { status: 400 });
  }

  await connectToDatabase();
  const admin = await AdminModel.findByIdAndDelete(id);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
