import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ skillId: string }>;
}

// GET /api/skills/[skillId] - Get single skill with endorsers
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { skillId } = await params;

  try {
    // Get skill
    const { data: skill, error } = await supabase
      .from("user_skills")
      .select(`
        id,
        user_email,
        skill_name,
        proficiency,
        endorsement_count,
        created_at
      `)
      .eq("id", skillId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      throw error;
    }

    // Get endorsers
    const { data: endorsements } = await supabase
      .from("skill_endorsements")
      .select("endorser_email, created_at")
      .eq("skill_id", skillId)
      .order("created_at", { ascending: false });

    // Get endorser profiles
    const endorserEmails = endorsements?.map(e => e.endorser_email) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, username, display_name")
      .in("email", endorserEmails);

    const { data: accounts } = await supabase
      .from("user accounts")
      .select("email, name, image_url")
      .in("email", endorserEmails);

    const endorsers = endorsements?.map(e => {
      const profile = profiles?.find(p => p.email === e.endorser_email);
      const account = accounts?.find(a => a.email === e.endorser_email);
      return {
        email: e.endorser_email,
        username: profile?.username,
        name: profile?.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        endorsedAt: e.created_at,
      };
    }) || [];

    return NextResponse.json({
      skill: {
        ...skill,
        endorsers,
      },
    });
  } catch (error) {
    console.error("Error fetching skill:", error);
    return NextResponse.json({ error: "Failed to fetch skill" }, { status: 500 });
  }
}

// DELETE /api/skills/[skillId] - Delete a skill
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { skillId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("user_skills")
      .select("user_email")
      .eq("id", skillId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      throw fetchError;
    }

    if (existing.user_email !== userEmail) {
      return NextResponse.json(
        { error: "You can only delete your own skills" },
        { status: 403 }
      );
    }

    // Delete the skill (cascades to endorsements)
    const { error } = await supabase
      .from("user_skills")
      .delete()
      .eq("id", skillId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
