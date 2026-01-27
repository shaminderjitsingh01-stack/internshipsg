import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const userEmail = formData.get("userEmail") as string;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `interviews/${userEmail?.replace(/[^a-zA-Z0-9]/g, "_") || "anonymous"}/${timestamp}.webm`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: "video/webm",
    });

    return NextResponse.json({
      url: blob.url,
      success: true
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
