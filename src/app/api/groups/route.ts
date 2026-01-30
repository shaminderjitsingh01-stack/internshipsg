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

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  cover_image: string | null;
  privacy: string;
  rules: string | null;
  creator_email: string;
  member_count: number;
  post_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  membership_status?: string;
  user_role?: string;
}

// Helper: Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/groups - List groups with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const userEmail = searchParams.get("user_email") || "";
  const membership = searchParams.get("membership") || ""; // 'joined', 'created', 'all'
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    // Build base query
    let query = db
      .from("groups")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    // If filtering by membership, we need to join with group_members
    if (membership === "joined" && userEmail) {
      // Get groups where user is a member
      const { data: memberGroups } = await db
        .from("group_members")
        .select("group_id")
        .eq("user_email", userEmail)
        .eq("status", "active");

      const groupIds = memberGroups?.map((m) => m.group_id) || [];
      if (groupIds.length > 0) {
        query = query.in("id", groupIds);
      } else {
        // No groups found, return empty
        return NextResponse.json({
          groups: [],
          total: 0,
          page,
          limit,
        });
      }
    } else if (membership === "created" && userEmail) {
      query = query.eq("creator_email", userEmail);
    }

    // Apply sorting and pagination
    query = query.order("member_count", { ascending: false });
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: groups, error, count } = await query;

    if (error) throw error;

    // Get user's membership status for each group if userEmail provided
    let enrichedGroups = groups || [];
    if (userEmail && groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const { data: memberships } = await db
        .from("group_members")
        .select("group_id, role, status")
        .eq("user_email", userEmail)
        .in("group_id", groupIds);

      const membershipMap = new Map(
        memberships?.map((m) => [m.group_id, { role: m.role, status: m.status }]) || []
      );

      enrichedGroups = groups.map((group) => {
        const membership = membershipMap.get(group.id);
        return {
          ...group,
          is_member: membership?.status === "active",
          membership_status: membership?.status || null,
          user_role: membership?.role || null,
        };
      });
    }

    return NextResponse.json({
      groups: enrichedGroups,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      category = "interest",
      cover_image,
      privacy = "public",
      rules,
      creator_email,
    } = body;

    // Validate required fields
    if (!name || !creator_email) {
      return NextResponse.json(
        { error: "Name and creator email are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["career", "industry", "school", "interest"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validate privacy
    const validPrivacyOptions = ["public", "private", "invite-only"];
    if (!validPrivacyOptions.includes(privacy)) {
      return NextResponse.json({ error: "Invalid privacy setting" }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 0;

    // Check for existing slug
    while (true) {
      const { data: existing } = await db
        .from("groups")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create the group
    const { data: group, error } = await db
      .from("groups")
      .insert({
        name,
        slug,
        description,
        category,
        cover_image,
        privacy,
        rules,
        creator_email,
        member_count: 1, // Creator is automatically a member
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as a member with 'creator' role
    const { error: memberError } = await db.from("group_members").insert({
      group_id: group.id,
      user_email: creator_email,
      role: "creator",
      status: "active",
    });

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
    }

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
