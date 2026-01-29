import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/skills - Get user skills
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const skillName = searchParams.get("skill_name");

  try {
    // Get skills by skill name (search/filter)
    if (skillName && !email) {
      const { data, error } = await supabase
        .from("user_skills")
        .select(`
          id,
          user_email,
          skill_name,
          proficiency,
          endorsement_count,
          created_at
        `)
        .ilike("skill_name", `%${skillName}%`)
        .order("endorsement_count", { ascending: false })
        .limit(50);

      if (error) throw error;

      return NextResponse.json({ skills: data || [] });
    }

    // Get skills for a specific user
    if (email) {
      const { data, error } = await supabase
        .from("user_skills")
        .select(`
          id,
          user_email,
          skill_name,
          proficiency,
          endorsement_count,
          created_at
        `)
        .eq("user_email", email)
        .order("endorsement_count", { ascending: false });

      if (error) throw error;

      // Get endorsers for each skill if requested
      const includeEndorsers = searchParams.get("include_endorsers") === "true";
      let skills = data || [];

      if (includeEndorsers && skills.length > 0) {
        const skillIds = skills.map(s => s.id);
        const { data: endorsements } = await supabase
          .from("skill_endorsements")
          .select("skill_id, endorser_email, created_at")
          .in("skill_id", skillIds)
          .order("created_at", { ascending: false });

        // Get endorser profiles
        const endorserEmails = [...new Set(endorsements?.map(e => e.endorser_email) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email, username, display_name")
          .in("email", endorserEmails);

        const { data: accounts } = await supabase
          .from("user accounts")
          .select("email, name, image_url")
          .in("email", endorserEmails);

        // Attach endorsers to skills
        skills = skills.map(skill => ({
          ...skill,
          endorsers: endorsements
            ?.filter(e => e.skill_id === skill.id)
            .map(e => {
              const profile = profiles?.find(p => p.email === e.endorser_email);
              const account = accounts?.find(a => a.email === e.endorser_email);
              return {
                email: e.endorser_email,
                username: profile?.username,
                name: profile?.display_name || account?.name || "Anonymous",
                image: account?.image_url,
                endorsedAt: e.created_at,
              };
            }) || [],
        }));
      }

      return NextResponse.json({ skills });
    }

    // Get popular skills
    const { data, error } = await supabase
      .from("user_skills")
      .select("skill_name")
      .order("endorsement_count", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Count unique skills
    const skillCounts = (data || []).reduce((acc: Record<string, number>, curr) => {
      acc[curr.skill_name] = (acc[curr.skill_name] || 0) + 1;
      return acc;
    }, {});

    const popularSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({ popularSkills });
  } catch (error) {
    console.error("Skills GET error:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

// POST /api/skills - Add a skill
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { user_email, skill_name, proficiency } = await request.json();

    if (!user_email || !skill_name) {
      return NextResponse.json(
        { error: "User email and skill name are required" },
        { status: 400 }
      );
    }

    // Validate proficiency
    const validProficiencies = ["beginner", "intermediate", "advanced", "expert"];
    const skillProficiency = validProficiencies.includes(proficiency) ? proficiency : "intermediate";

    // Normalize skill name (trim and capitalize first letters)
    const normalizedSkillName = skill_name
      .trim()
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Check if skill already exists for this user
    const { data: existing } = await supabase
      .from("user_skills")
      .select("id")
      .eq("user_email", user_email)
      .eq("skill_name", normalizedSkillName)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have this skill" },
        { status: 409 }
      );
    }

    // Insert the skill
    const { data: skill, error } = await supabase
      .from("user_skills")
      .insert({
        user_email,
        skill_name: normalizedSkillName,
        proficiency: skillProficiency,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      skill,
      message: "Skill added successfully",
    });
  } catch (error) {
    console.error("Skills POST error:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}

// PUT /api/skills - Update skill proficiency
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id, user_email, proficiency } = await request.json();

    if (!id || !user_email) {
      return NextResponse.json(
        { error: "Skill ID and user email are required" },
        { status: 400 }
      );
    }

    // Validate proficiency
    const validProficiencies = ["beginner", "intermediate", "advanced", "expert"];
    if (!validProficiencies.includes(proficiency)) {
      return NextResponse.json(
        { error: "Invalid proficiency level" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("user_skills")
      .select("user_email")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (existing.user_email !== user_email) {
      return NextResponse.json(
        { error: "You can only update your own skills" },
        { status: 403 }
      );
    }

    // Update the skill
    const { data: skill, error } = await supabase
      .from("user_skills")
      .update({ proficiency })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      skill,
      message: "Skill updated successfully",
    });
  } catch (error) {
    console.error("Skills PUT error:", error);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}
