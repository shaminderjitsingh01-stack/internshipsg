import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ skillId: string }>;
}

// GET /api/skills/[skillId]/endorse - Check if user has endorsed
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { skillId } = await params;
  const { searchParams } = new URL(request.url);
  const endorserEmail = searchParams.get("endorser_email");

  if (!endorserEmail) {
    return NextResponse.json({ error: "Endorser email is required" }, { status: 400 });
  }

  try {
    const { data } = await supabase
      .from("skill_endorsements")
      .select("id")
      .eq("skill_id", skillId)
      .eq("endorser_email", endorserEmail)
      .single();

    return NextResponse.json({ hasEndorsed: !!data });
  } catch (error) {
    console.error("Endorsement check error:", error);
    return NextResponse.json({ error: "Failed to check endorsement" }, { status: 500 });
  }
}

// POST /api/skills/[skillId]/endorse - Endorse a skill
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { skillId } = await params;

  try {
    const { endorser_email } = await request.json();

    if (!endorser_email) {
      return NextResponse.json(
        { error: "Endorser email is required" },
        { status: 400 }
      );
    }

    // Check if skill exists and get owner
    const { data: skill, error: skillError } = await supabase
      .from("user_skills")
      .select("id, user_email, skill_name")
      .eq("id", skillId)
      .single();

    if (skillError) {
      if (skillError.code === "PGRST116") {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      throw skillError;
    }

    // Prevent self-endorsement
    if (skill.user_email === endorser_email) {
      return NextResponse.json(
        { error: "You cannot endorse your own skills" },
        { status: 400 }
      );
    }

    // Check if already endorsed
    const { data: existing } = await supabase
      .from("skill_endorsements")
      .select("id")
      .eq("skill_id", skillId)
      .eq("endorser_email", endorser_email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already endorsed this skill" },
        { status: 409 }
      );
    }

    // Create endorsement
    const { error: insertError } = await supabase
      .from("skill_endorsements")
      .insert({
        skill_id: skillId,
        endorser_email,
      });

    if (insertError) throw insertError;

    // Note: The trigger will automatically update the endorsement_count

    // Create notification for the skill owner
    await supabase.from("notifications").insert({
      user_email: skill.user_email,
      type: "endorsement",
      actor_email: endorser_email,
      title: "New skill endorsement",
      body: `endorsed your ${skill.skill_name} skill`,
      link: `/profile`,
    }).catch(() => {
      // Ignore notification errors
    });

    return NextResponse.json({
      success: true,
      message: "Skill endorsed successfully",
    });
  } catch (error) {
    console.error("Endorsement POST error:", error);
    return NextResponse.json({ error: "Failed to endorse skill" }, { status: 500 });
  }
}

// DELETE /api/skills/[skillId]/endorse - Remove endorsement
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { skillId } = await params;
  const { searchParams } = new URL(request.url);
  const endorserEmail = searchParams.get("endorser_email");

  if (!endorserEmail) {
    return NextResponse.json(
      { error: "Endorser email is required" },
      { status: 400 }
    );
  }

  try {
    // Delete endorsement
    const { error } = await supabase
      .from("skill_endorsements")
      .delete()
      .eq("skill_id", skillId)
      .eq("endorser_email", endorserEmail);

    if (error) throw error;

    // Note: The trigger will automatically update the endorsement_count

    return NextResponse.json({
      success: true,
      message: "Endorsement removed successfully",
    });
  } catch (error) {
    console.error("Endorsement DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove endorsement" }, { status: 500 });
  }
}
