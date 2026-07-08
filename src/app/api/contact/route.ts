import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessageModel from "@/lib/models/ContactMessage";
import { sendContactNotification } from "@/lib/email";
import { getRequestIp, isRateLimited, makeLimiter } from "@/lib/rate-limit";

const limiter = makeLimiter("contact", 5, "10 m");

export async function POST(request: NextRequest) {
  if (await isRateLimited(limiter, getRequestIp(request))) {
    return NextResponse.json({ success: false, message: "Too many messages. Try again later." }, { status: 429 });
  }

  await connectToDatabase();
  const { name, email, subject, message } = await request.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
  }

  const doc = await ContactMessageModel.create({ name, email, subject, message });

  try {
    await sendContactNotification({ name, email, subject, message });
  } catch (error) {
    console.error("Failed to send contact notification email:", error);
  }

  return NextResponse.json({ success: true, data: { id: doc._id } }, { status: 201 });
}
