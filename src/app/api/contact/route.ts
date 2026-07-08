import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessageModel from "@/lib/models/ContactMessage";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { name, email, subject, message } = await request.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
  }

  const doc = await ContactMessageModel.create({ name, email, subject, message });
  return NextResponse.json({ success: true, data: { id: doc._id } }, { status: 201 });
}
