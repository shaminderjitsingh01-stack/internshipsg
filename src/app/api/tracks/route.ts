import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INDUSTRY_TRACKS, getTrackBySlug } from "@/data/industryTracks";

// GET - Fetch user's track progress
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("email");
  const trackSlug = searchParams.get("trackSlug");

  if (!userEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // If database is not configured, return empty progress
  if (!isSupabaseConfigured()) {
    if (trackSlug) {
      const track = getTrackBySlug(trackSlug);
      return NextResponse.json({
        trackProgress: {
          trackSlug,
          completedModules: [],
          totalModules: track?.modules.length || 0,
          percentage: 0,
        },
      });
    }

    return NextResponse.json({
      progress: INDUSTRY_TRACKS.map((track) => ({
        trackSlug: track.slug,
        completedModules: [],
        totalModules: track.modules.length,
        percentage: 0,
      })),
    });
  }

  try {
    // Get or create user
    let { data: user, error: userError } = await supabase!
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (!user) {
      // User doesn't exist yet, return empty progress
      if (trackSlug) {
        const track = getTrackBySlug(trackSlug);
        return NextResponse.json({
          trackProgress: {
            trackSlug,
            completedModules: [],
            totalModules: track?.modules.length || 0,
            percentage: 0,
          },
        });
      }

      return NextResponse.json({
        progress: INDUSTRY_TRACKS.map((track) => ({
          trackSlug: track.slug,
          completedModules: [],
          totalModules: track.modules.length,
          percentage: 0,
        })),
      });
    }

    // Fetch track progress
    if (trackSlug) {
      const { data: progressData, error: progressError } = await supabase!
        .from("track_progress")
        .select("module_id, completed_at")
        .eq("user_id", user.id)
        .eq("track_slug", trackSlug);

      if (progressError) {
        console.error("Error fetching track progress:", progressError);
        return NextResponse.json(
          { error: "Failed to fetch progress" },
          { status: 500 }
        );
      }

      const track = getTrackBySlug(trackSlug);
      const completedModules = progressData?.map((p) => p.module_id) || [];

      return NextResponse.json({
        trackProgress: {
          trackSlug,
          completedModules,
          totalModules: track?.modules.length || 0,
          percentage: track
            ? Math.round((completedModules.length / track.modules.length) * 100)
            : 0,
        },
      });
    }

    // Fetch all track progress
    const { data: allProgress, error: allProgressError } = await supabase!
      .from("track_progress")
      .select("track_slug, module_id")
      .eq("user_id", user.id);

    if (allProgressError) {
      console.error("Error fetching all progress:", allProgressError);
      return NextResponse.json(
        { error: "Failed to fetch progress" },
        { status: 500 }
      );
    }

    // Group by track
    const progressByTrack: Record<string, string[]> = {};
    allProgress?.forEach((p) => {
      if (!progressByTrack[p.track_slug]) {
        progressByTrack[p.track_slug] = [];
      }
      progressByTrack[p.track_slug].push(p.module_id);
    });

    const progress = INDUSTRY_TRACKS.map((track) => {
      const completedModules = progressByTrack[track.slug] || [];
      return {
        trackSlug: track.slug,
        completedModules,
        totalModules: track.modules.length,
        percentage: Math.round(
          (completedModules.length / track.modules.length) * 100
        ),
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error in GET /api/tracks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Mark module as complete/incomplete
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { userEmail, trackSlug, moduleId, action } = body;

    if (!userEmail || !trackSlug || !moduleId) {
      return NextResponse.json(
        { error: "userEmail, trackSlug, and moduleId are required" },
        { status: 400 }
      );
    }

    // Validate track and module exist
    const track = getTrackBySlug(trackSlug);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const moduleExists = track.modules.some((m) => m.id === moduleId);
    if (!moduleExists) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get or create user
    let { data: user, error: userError } = await supabase!
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (!user) {
      // Create user
      const { data: newUser, error: createError } = await supabase!
        .from("users")
        .insert([{ email: userEmail }])
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      user = newUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to get or create user" },
        { status: 500 }
      );
    }

    if (action === "uncomplete") {
      // Remove completion
      const { error: deleteError } = await supabase!
        .from("track_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("track_slug", trackSlug)
        .eq("module_id", moduleId);

      if (deleteError) {
        console.error("Error removing completion:", deleteError);
        return NextResponse.json(
          { error: "Failed to update progress" },
          { status: 500 }
        );
      }
    } else {
      // Mark as complete (upsert)
      const { error: upsertError } = await supabase!
        .from("track_progress")
        .upsert(
          [
            {
              user_id: user.id,
              track_slug: trackSlug,
              module_id: moduleId,
              completed_at: new Date().toISOString(),
            },
          ],
          {
            onConflict: "user_id,track_slug,module_id",
          }
        );

      if (upsertError) {
        console.error("Error marking complete:", upsertError);
        return NextResponse.json(
          { error: "Failed to update progress" },
          { status: 500 }
        );
      }
    }

    // Fetch updated progress
    const { data: progressData, error: progressError } = await supabase!
      .from("track_progress")
      .select("module_id")
      .eq("user_id", user.id)
      .eq("track_slug", trackSlug);

    if (progressError) {
      console.error("Error fetching updated progress:", progressError);
    }

    const completedModules = progressData?.map((p) => p.module_id) || [];
    const percentage = Math.round(
      (completedModules.length / track.modules.length) * 100
    );

    return NextResponse.json({
      success: true,
      trackProgress: {
        trackSlug,
        completedModules,
        totalModules: track.modules.length,
        percentage,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/tracks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
