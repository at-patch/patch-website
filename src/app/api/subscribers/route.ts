import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SubscriberModel from "@/lib/models/Subscriber";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  try {
    await SubscriberModel.create({ email });
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    if (!isDuplicate) throw error;
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
