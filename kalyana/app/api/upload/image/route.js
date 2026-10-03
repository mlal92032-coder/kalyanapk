import { NextResponse } from "next/server";
import { saveBase64Image } from "@/lib/fileStorage";
import { getAdminSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { image_base64, filename } = body;

    if (!image_base64) {
      return NextResponse.json({ error: "Image data is required." }, { status: 400 });
    }

    // Save the image and get the URL
    const imageUrl = saveBase64Image(image_base64, filename || "image.jpg");

    console.log(`[API] Image uploaded by ${session.email}: ${imageUrl}`);

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error("[API] Error in POST /api/upload/image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
