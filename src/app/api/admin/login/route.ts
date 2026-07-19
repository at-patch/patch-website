import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, createAdminToken } from "@/lib/auth";
import AdminModel from "@/lib/models/Admin";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { loginSchema } from "@/lib/validation/auth.schemas";

const limiter = makeLimiter("admin-login", 5, "60 s");

const INVALID_CREDENTIALS = NextResponse.json(
  { success: false, message: "Invalid email or password." },
  { status: 401 }
);

// First-ever admin login bootstraps the "owner" account from the
// ADMIN_EMAIL/ADMIN_PASSWORD env vars, so solo operators don't need a
// separate migration step to move onto the Admin collection.
async function bootstrapOwnerIfNeeded(email: string, password: string) {
  const existingCount = await AdminModel.countDocuments({});
  if (existingCount > 0) return null;

  const bootstrapEmail = process.env.ADMIN_EMAIL;
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  if (!bootstrapEmail || !bootstrapPassword) return null;
  if (email !== bootstrapEmail || password !== bootstrapPassword) return null;

  const passwordHash = await bcrypt.hash(password, 10);
  return AdminModel.create({
    name: "Owner",
    email: bootstrapEmail.toLowerCase(),
    passwordHash,
    role: "owner",
    active: true,
  });
}

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, loginSchema);
  if (!parsed.success) return parsed.response;
  const { email, password } = parsed.data;

  await connectToDatabase();

  const admin =
    (await bootstrapOwnerIfNeeded(email, password)) ??
    (await AdminModel.findOne({ email: email.toLowerCase(), active: true }));

  if (!admin) return INVALID_CREDENTIALS;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return INVALID_CREDENTIALS;

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = await createAdminToken({
    sub: admin._id.toString(),
    email: admin.email,
    role: admin.role as "owner" | "staff",
  });

  const response = NextResponse.json({ success: true, data: { email: admin.email, role: admin.role } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
