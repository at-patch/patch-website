import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AboutSettingsModel from "@/lib/models/AboutSettings";
import { requireAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { aboutSettingsUpdateSchema } from "@/lib/validation/cms.schemas";

const DEFAULT_NARRATIVES = [
  {
    title: "Every garment starts as waste.",
    body: "Bangladesh produces more garment waste than almost anywhere else on earth — factory offcuts, returned stock, donated clothing that would otherwise end up landfilled or burned. Patch exists to interrupt that cycle.",
    image: "",
  },
  {
    title: "We rework it by hand.",
    body: "We collect raw material — offcuts, donated garments, factory deadstock — log it, sort it, and rework it by hand into new pieces. Because the input is never uniform, no two Patch garments are the same.",
    image: "",
  },
  {
    title: "Scarcity isn't a marketing trick.",
    body: "When a piece sells, it's gone. We don't reprint, we don't restock — the next batch is made from whatever waste comes in next. That's just how the material works.",
    image: "",
  },
];

async function getSettings() {
  return AboutSettingsModel.findOneAndUpdate(
    { key: "about" },
    { $setOnInsert: { key: "about", narratives: DEFAULT_NARRATIVES } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const settings = await getSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const parsed = await parseJsonBody(request, aboutSettingsUpdateSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const settings = await AboutSettingsModel.findOneAndUpdate(
    { key: "about" },
    { $set: parsed.data, $setOnInsert: { key: "about" } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ success: true, data: settings });
}
