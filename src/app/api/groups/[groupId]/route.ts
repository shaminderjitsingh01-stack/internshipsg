import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy Supabase client initialization
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

// GET /api/groups/[groupId] - Get group details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("user_email") || "";

  try {
    // Fetch group by ID or slug
    let query = db.from("groups").select("*");

    // Check if groupId is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
    if (isUUID) {
      query = query.eq("id", groupId);
    } else {
      query = query.eq("slug", groupId);
    }

    const { data: group, error } = await query.single();

    if (error || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if group is active
    if (!group.is_active) {
      return NextResponse.json({ error: "Group is no longer active" }, { status: 404 });
    }

    // Get user's membership status if userEmail provided
    let membershipInfo = null;
    if (userEmail) {
      const { data: membership } = await db
        .from("group_members")
        .select("role, status, joined_at")
        .eq("group_id", group.id)
        .eq("user_email", userEmail)
        .single();

      membershipInfo = membership;
    }

    // For private groups, check if user has access
    if (group.privacy !== "public" && !membershipInfo) {
      return NextResponse.json({
        group: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          category: group.category,
          cover_image: group.cover_image,
          privacy: group.privacy,
          member_count: group.member_count,
          is_private: true,
        },
        is_member: false,
        can_view: false,
      });
    }

    // Get creator info
    const { data: creatorProfile } = await db
      .from("profiles")
      .select("username, display_name")
      .eq("email", group.creator_email)
      .single();

    const { data: creatorAccount } = await db
      .from("user accounts")
      .select("name, image_url")
      .eq("email", group.creator_email)
      .single();

    return NextResponse.json({
      group: {
        ...group,
        creator: {
          email: group.creator_email,
          username: creatorProfile?.username,
          name: creatorProfile?.display_name || creatorAccount?.name,
          image: creatorAccount?.image_url,
        },
      },
      is_member: membershipInfo?.status === "active",
      membership_status: membershipInfo?.status || null,
      user_role: membershipInfo?.role || null,
      joined_at: membershipInfo?.joined_at || null,
      can_view: true,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

// PUT /api/groups/[groupId] - Update group (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;

  try {
    const body = await request.json();
    const {
      user_email,
      name,
      description,
      category,
      cover_image,
      privacy,
      rules,
    } = body;

    if (!user_email) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    // Check if user is admin or creator
    const { data: membership } = await db
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_email", user_email)
      .single();

    if (!membership || !["creator", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized to update this group" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) {
      const validCategories = ["career", "industry", "school", "interest"];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updates.category = category;
    }
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (privacy !== undefined) {
      const validPrivacyOptions = ["public", "private", "invite-only"];
      if (!validPrivacyOptions.includes(privacy)) {
        return NextResponse.json({ error: "Invalid privacy setting" }, { status: 400 });
      }
      updates.privacy = privacy;
    }
    if (rules !== undefined) updates.rules = rules;

    const { data: group, error } = await db
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId] - Delete group (creator only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { groupId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const userEmail = searchParams.get("user_email");

  if (!userEmail) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  try {
    // Verify user is the creator
    const { data: group } = await db
      .from("groups")
      .select("creator_email")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.creator_email !== userEmail) {
      return NextResponse.json({ error: "Only the creator can delete this group" }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error } = await db
      .from("groups")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", groupId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
