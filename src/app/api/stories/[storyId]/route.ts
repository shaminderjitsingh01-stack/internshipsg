import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ storyId: string }>;
}

// GET - Get single story and mark as viewed
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { storyId } = await params;
  const { searchParams } = new URL(request.url);
  const viewerEmail = searchParams.get("viewer");

  try {
    const { data: story, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (error) throw error;

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Mark as viewed if viewer is provided and not the author
    if (viewerEmail && viewerEmail !== story.author_email) {
      try {
        await supabase
          .from("story_views")
          .insert({ story_id: storyId, viewer_email: viewerEmail });

        // Increment view count
        await supabase
          .from("stories")
          .update({ view_count: (story.view_count || 0) + 1 })
          .eq("id", storyId);
      } catch {
        // Ignore duplicate view errors
      }
    }

    // Get author info
    const { data: author } = await supabase
      .from("profiles")
      .select("email, username, name, image_url")
      .eq("email", story.author_email)
      .single();

    return NextResponse.json({ story: { ...story, author } });
  } catch (error) {
    console.error("Get story error:", error);
    return NextResponse.json({ error: "Failed to get story" }, { status: 500 });
  }
}

// DELETE - Delete a story
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { storyId } = await params;
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("email");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Verify ownership
    const { data: story } = await supabase
      .from("stories")
      .select("author_email")
      .eq("id", storyId)
      .single();

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.author_email !== userEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Delete story error:", error);
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
  }
}
