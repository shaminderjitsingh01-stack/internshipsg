import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Get stories from followed users
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("email");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Get followed users
    const { data: follows } = await supabase
      .from("follows")
      .select("following_email")
      .eq("follower_email", userEmail);

    const followedEmails = follows?.map(f => f.following_email) || [];
    followedEmails.push(userEmail); // Include own stories

    // Get active stories (not expired)
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*")
      .in("author_email", followedEmails)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get author info for each story
    const authorEmails = [...new Set(stories?.map(s => s.author_email) || [])];
    const { data: authors } = await supabase
      .from("profiles")
      .select("email, username, name, image_url")
      .in("email", authorEmails);

    // Get user's viewed stories
    const storyIds = stories?.map(s => s.id) || [];
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_email", userEmail)
      .in("story_id", storyIds);

    const viewedStoryIds = new Set(views?.map(v => v.story_id) || []);

    // Group stories by author
    const authorMap = new Map(authors?.map(a => [a.email, a]) || []);
    const storiesByAuthor = new Map<string, any[]>();

    stories?.forEach(story => {
      const author = authorMap.get(story.author_email);
      const existing = storiesByAuthor.get(story.author_email) || [];
      existing.push({
        ...story,
        author,
        isViewed: viewedStoryIds.has(story.id),
      });
      storiesByAuthor.set(story.author_email, existing);
    });

    // Convert to array, putting user's stories first
    const result = Array.from(storiesByAuthor.entries()).map(([email, stories]) => ({
      authorEmail: email,
      author: authorMap.get(email),
      stories,
      hasUnviewed: stories.some(s => !s.isViewed),
      isCurrentUser: email === userEmail,
    }));

    // Sort: current user first, then unviewed, then viewed
    result.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return NextResponse.json({ storyGroups: result });
  } catch (error) {
    console.error("Get stories error:", error);
    return NextResponse.json({ error: "Failed to get stories" }, { status: 500 });
  }
}

// POST - Create a story
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { author_email, content, media_url, media_type, background_color, text_color } = body;

    if (!author_email) {
      return NextResponse.json({ error: "Author email required" }, { status: 400 });
    }

    if (!content && !media_url) {
      return NextResponse.json({ error: "Content or media required" }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from("stories")
      .insert({
        author_email,
        content: content || null,
        media_url: media_url || null,
        media_type: media_type || "image",
        background_color: background_color || "#dc2626",
        text_color: text_color || "#ffffff",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, story: data });
  } catch (error) {
    console.error("Create story error:", error);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
