import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PatternModel from "@/lib/models/Pattern";
import { requireAdmin } from "@/lib/require-admin";
import { generateShortCode } from "@/lib/utils";
import { parseJsonBody } from "@/lib/validation";
import { patternCreateSchema } from "@/lib/validation/admin-material.schemas";

const STARTER_PATTERNS = [
  {
    patternCode: "PAT-1001",
    patternImage: "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?fm=jpg&q=80&w=800&auto=format&fit=crop",
    fabricCode: "Fab-066, Ash leopard, Fab-058",
    sampleCode: "",
    fabAmount1: "1.75 Yards",
    fabricAmount2: "45*60",
    size1: 1,
    size2: 0.75,
  },
  {
    patternCode: "PAT-1002",
    patternImage: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?fm=jpg&q=80&w=800&auto=format&fit=crop",
    fabricCode: "Fab-060, 066 Sample Factory teh",
    sampleCode: "",
    fabAmount1: "1 Yard",
    fabricAmount2: "36*48",
    size1: 1,
    size2: 0.5,
  },
];

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const patterns = await PatternModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: patterns, total: patterns.length });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const existing = await PatternModel.countDocuments({});
  if (existing > 0) {
    return NextResponse.json({ success: false, message: "Patterns already have records." }, { status: 409 });
  }

  const patterns = await PatternModel.insertMany(STARTER_PATTERNS);
  return NextResponse.json({ success: true, data: patterns, total: patterns.length }, { status: 201 });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, patternCreateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();

  try {
    let pattern = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const patternCode = generateShortCode("PAT");
      try {
        pattern = await PatternModel.create({ ...parsed.data, patternCode });
        break;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    if (!pattern) throw new Error("Failed to generate a unique pattern code.");
    return NextResponse.json({ success: true, data: pattern }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create pattern.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
