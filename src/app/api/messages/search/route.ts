import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Search users to start a conversation with
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const email = searchParams.get("email"); // current user email
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // If no query, get recent conversations and following
    if (!query) {
      // Get users the current user follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_email")
        .eq("follower_email", email)
        .limit(limit);

      const followingEmails = following?.map(f => f.following_email) || [];

      if (followingEmails.length === 0) {
        return NextResponse.json({ users: [] });
      }

      // Get profiles and accounts for following
      const [profilesRes, accountsRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name, school").in("email", followingEmails),
        supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", followingEmails),
      ]);

      const users = followingEmails.map(followingEmail => {
        const profile = profilesRes.data?.find(p => p.email === followingEmail);
        const account = accountsRes.data?.find(a => a.email === followingEmail);
        return {
          email: followingEmail,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
          school: profile?.school,
          tier: account?.tier,
          level: account?.level,
        };
      }).filter(u => u.name);

      return NextResponse.json({ users });
    }

    // Search by name or username
    const searchTerm = `%${query.toLowerCase()}%`;

    // Search profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, username, display_name, school")
      .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
      .neq("email", email)
      .limit(limit);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      // Try searching user accounts by name
      const { data: accounts, error: accountsError } = await supabase
        .from("user accounts")
        .select("email, name, image_url, tier, level")
        .ilike("name", searchTerm)
        .neq("email", email)
        .limit(limit);

      if (accountsError) throw accountsError;

      const users = accounts?.map(account => ({
        email: account.email,
        username: null,
        name: account.name || "Anonymous",
        image: account.image_url,
        school: null,
        tier: account.tier,
        level: account.level,
      })) || [];

      return NextResponse.json({ users });
    }

    const profileEmails = profiles.map(p => p.email);

    // Get accounts for profile emails
    const { data: accounts } = await supabase
      .from("user accounts")
      .select("email, name, image_url, tier, level")
      .in("email", profileEmails);

    const users = profiles.map(profile => {
      const account = accounts?.find(a => a.email === profile.email);
      return {
        email: profile.email,
        username: profile.username,
        name: profile.display_name || account?.name || "Anonymous",
        image: account?.image_url,
        school: profile.school,
        tier: account?.tier,
        level: account?.level,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
