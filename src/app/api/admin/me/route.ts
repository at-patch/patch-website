import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  // `role`/`sub` are absent on sessions issued before roles existed — the
  // client treats a missing role as "staff" until the admin logs in again.
  return NextResponse.json({
    success: true,
    data: { email: admin.email, role: admin.role ?? "staff" },
  });
}
