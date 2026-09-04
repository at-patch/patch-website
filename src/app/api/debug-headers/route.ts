import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(Object.fromEntries(request.headers.entries()));
}
