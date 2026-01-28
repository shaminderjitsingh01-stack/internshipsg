import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for imported job descriptions (expires after 5 minutes)
const importStore = new Map<string, { text: string; timestamp: number }>();

// Clean up old entries every request
function cleanupOldEntries() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [id, data] of importStore.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      importStore.delete(id);
    }
  }
}

// Generate a simple random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    cleanupOldEntries();

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.length < 50) {
      return NextResponse.json(
        { error: "Invalid or too short text" },
        { status: 400 }
      );
    }

    // Generate ID and store
    const id = generateId();
    importStore.set(id, {
      text: text.substring(0, 30000), // Limit to 30k chars
      timestamp: Date.now(),
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Import job error:", error);
    return NextResponse.json(
      { error: "Failed to store job description" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    cleanupOldEntries();

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const data = importStore.get(id);

    if (!data) {
      return NextResponse.json(
        { error: "Import expired or not found" },
        { status: 404 }
      );
    }

    // Delete after retrieval (one-time use)
    importStore.delete(id);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Get import error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve job description" },
      { status: 500 }
    );
  }
}
