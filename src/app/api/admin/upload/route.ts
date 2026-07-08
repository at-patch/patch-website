import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const UPLOAD_FOLDERS = {
  products: "patch/products",
  categories: "patch/categories",
} as const;

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, message: "Only JPEG, PNG, WEBP, or AVIF images are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, message: "Image must be under 8MB." },
      { status: 400 }
    );
  }

  const targetFolder =
    typeof folder === "string" && folder in UPLOAD_FOLDERS
      ? UPLOAD_FOLDERS[folder as keyof typeof UPLOAD_FOLDERS]
      : UPLOAD_FOLDERS.products;

  try {
    const cloudinary = getCloudinary();
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: targetFolder,
      resource_type: "image",
    });

    return NextResponse.json({ success: true, data: { url: result.secure_url } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
