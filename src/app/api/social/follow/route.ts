import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Check follow status or get followers/following list
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const targetEmail = searchParams.get("target");
  const type = searchParams.get("type"); // 'followers', 'following', 'status'

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Check if user follows target
    if (type === "status" && targetEmail) {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_email", email)
        .eq("following_email", targetEmail)
        .single();

      return NextResponse.json({ isFollowing: !!data });
    }

    // Get followers list
    if (type === "followers") {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower_email,
          created_at
        `)
        .eq("following_email", email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profile info for each follower
      const followerEmails = data?.map(f => f.follower_email) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, username, display_name, school, bio")
        .in("email", followerEmails);

      const { data: accounts } = await supabase
        .from("user accounts")
        .select("email, name, image_url, tier, level")
        .in("email", followerEmails);

      const followers = data?.map(f => {
        const profile = profiles?.find(p => p.email === f.follower_email);
        const account = accounts?.find(a => a.email === f.follower_email);
        return {
          email: f.follower_email,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
          school: profile?.school,
          bio: profile?.bio,
          tier: account?.tier,
          level: account?.level,
          followedAt: f.created_at,
        };
      }) || [];

      return NextResponse.json({ followers, count: followers.length });
    }

    // Get following list
    if (type === "following") {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          following_email,
          created_at
        `)
        .eq("follower_email", email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profile info for each following
      const followingEmails = data?.map(f => f.following_email) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, username, display_name, school, bio")
        .in("email", followingEmails);

      const { data: accounts } = await supabase
        .from("user accounts")
        .select("email, name, image_url, tier, level")
        .in("email", followingEmails);

      const following = data?.map(f => {
        const profile = profiles?.find(p => p.email === f.following_email);
        const account = accounts?.find(a => a.email === f.following_email);
        return {
          email: f.following_email,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
          school: profile?.school,
          bio: profile?.bio,
          tier: account?.tier,
          level: account?.level,
          followedAt: f.created_at,
        };
      }) || [];

      return NextResponse.json({ following, count: following.length });
    }

    // Get counts
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact" }).eq("following_email", email),
      supabase.from("follows").select("id", { count: "exact" }).eq("follower_email", email),
    ]);

    return NextResponse.json({
      followerCount: followersRes.count || 0,
      followingCount: followingRes.count || 0,
    });
  } catch (error) {
    console.error("Follow GET error:", error);
    return NextResponse.json({ error: "Failed to fetch follow data" }, { status: 500 });
  }
}

// POST - Follow a user
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { follower_email, following_email } = await request.json();

    if (!follower_email || !following_email) {
      return NextResponse.json({ error: "Both emails required" }, { status: 400 });
    }

    if (follower_email === following_email) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_email", follower_email)
      .eq("following_email", following_email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already following" }, { status: 409 });
    }

    // Create follow
    const { error } = await supabase.from("follows").insert({
      follower_email,
      following_email,
    });

    if (error) throw error;

    // Update counts
    try {
      await Promise.all([
        supabase.rpc("increment_follower_count", { user_email: following_email }),
        supabase.rpc("increment_following_count", { user_email: follower_email }),
      ]);
    } catch {
      // RPC might not exist yet, ignore
    }

    // Create notification for the followed user
    try {
      await supabase.from("notifications").insert({
        user_email: following_email,
        type: "follow",
        actor_email: follower_email,
        title: "New follower",
        body: "started following you",
        link: `/u/${follower_email}`,
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Followed successfully" });
  } catch (error) {
    console.error("Follow POST error:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const followerEmail = searchParams.get("follower");
  const followingEmail = searchParams.get("following");

  if (!followerEmail || !followingEmail) {
    return NextResponse.json({ error: "Both emails required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_email", followerEmail)
      .eq("following_email", followingEmail);

    if (error) throw error;

    // Update counts
    try {
      await Promise.all([
        supabase.rpc("decrement_follower_count", { user_email: followingEmail }),
        supabase.rpc("decrement_following_count", { user_email: followerEmail }),
      ]);
    } catch {}

    return NextResponse.json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
