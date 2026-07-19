import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type ParseResult<T> = { success: true; data: T } | { success: false; response: NextResponse };

// Parses and validates a request body against a zod schema, returning a
// ready-to-return 400 response on failure so every route reports invalid
// input the same way.
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request.";
    return {
      success: false,
      response: NextResponse.json({ success: false, message }, { status: 400 }),
    };
  }

  return { success: true, data: result.data };
}
