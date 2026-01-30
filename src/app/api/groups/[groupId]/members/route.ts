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

// GET /api/groups/[groupId]/members - List group members
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
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "active";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // Build query
    let query = db
      .from("group_members")
      .select("*", { count: "exact" })
      .eq("group_id", groupId);

    if (status) {
      query = query.eq("status", status);
    }

    if (role) {
      query = query.eq("role", role);
    }

    // Sort by role priority (creator > admin > moderator > member) then by join date
    query = query.order("joined_at", { ascending: true });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: members, error, count } = await query;

    if (error) throw error;

    // Enrich with user profiles
    if (members && members.length > 0) {
      const userEmails = members.map((m) => m.user_email);

      const [profilesRes, accountsRes] = await Promise.all([
        db.from("profiles").select("email, username, display_name, school").in("email", userEmails),
        db.from("user accounts").select("email, name, image_url, tier, level").in("email", userEmails),
      ]);

      const enrichedMembers = members.map((member) => {
        const profile = profilesRes.data?.find((p) => p.email === member.user_email);
        const account = accountsRes.data?.find((a) => a.email === member.user_email);

        return {
          ...member,
          user: {
            email: member.user_email,
            username: profile?.username,
            name: profile?.display_name || account?.name || "Anonymous",
            image: account?.image_url,
            school: profile?.school,
            tier: account?.tier,
            level: account?.level,
          },
        };
      });

      // Sort by role priority
      const rolePriority: Record<string, number> = {
        creator: 0,
        admin: 1,
        moderator: 2,
        member: 3,
      };

      enrichedMembers.sort((a, b) => {
        const priorityA = rolePriority[a.role] ?? 4;
        const priorityB = rolePriority[b.role] ?? 4;
        return priorityA - priorityB;
      });

      return NextResponse.json({
        members: enrichedMembers,
        total: count || 0,
        page,
        limit,
      });
    }

    return NextResponse.json({
      members: [],
      total: 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// POST /api/groups/[groupId]/members - Join group or request to join
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { user_email, action = "join" } = body;

    if (!user_email) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    // Get group info
    const { data: group } = await db
      .from("groups")
      .select("privacy, is_active")
      .eq("id", groupId)
      .single();

    if (!group || !group.is_active) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if already a member
    const { data: existingMember } = await db
      .from("group_members")
      .select("id, status, role")
      .eq("group_id", groupId)
      .eq("user_email", user_email)
      .single();

    if (existingMember) {
      if (existingMember.status === "active") {
        return NextResponse.json({ error: "Already a member of this group" }, { status: 400 });
      }
      if (existingMember.status === "pending") {
        return NextResponse.json({ error: "Join request already pending" }, { status: 400 });
      }
      if (existingMember.status === "banned") {
        return NextResponse.json({ error: "You are banned from this group" }, { status: 403 });
      }
    }

    // Determine status based on group privacy
    let status = "active";
    if (group.privacy === "private" || group.privacy === "invite-only") {
      status = "pending";
    }

    // For invite-only groups, check if there's a pending invitation
    if (group.privacy === "invite-only") {
      const { data: invitation } = await db
        .from("group_invitations")
        .select("id")
        .eq("group_id", groupId)
        .eq("invitee_email", user_email)
        .eq("status", "pending")
        .single();

      if (invitation) {
        // Accept the invitation
        status = "active";
        await db
          .from("group_invitations")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("id", invitation.id);
      } else if (action !== "request") {
        return NextResponse.json(
          { error: "This group is invite-only. You need an invitation to join." },
          { status: 403 }
        );
      }
    }

    // Create or update membership
    if (existingMember) {
      const { error } = await db
        .from("group_members")
        .update({ status, joined_at: new Date().toISOString() })
        .eq("id", existingMember.id);

      if (error) throw error;
    } else {
      const { error } = await db.from("group_members").insert({
        group_id: groupId,
        user_email,
        role: "member",
        status,
      });

      if (error) throw error;
    }

    // Create notification for group admins if request is pending
    if (status === "pending") {
      const { data: admins } = await db
        .from("group_members")
        .select("user_email")
        .eq("group_id", groupId)
        .in("role", ["creator", "admin"]);

      if (admins) {
        for (const admin of admins) {
          await db.from("notifications").insert({
            user_email: admin.user_email,
            type: "group_join_request",
            actor_email: user_email,
            title: "New join request",
            body: "Someone wants to join your group",
            link: `/groups/${groupId}/members?status=pending`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message: status === "pending" ? "Join request sent" : "Successfully joined group",
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/members - Leave group or remove member
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
  const targetEmail = searchParams.get("target_email") || userEmail;
  const action = searchParams.get("action") || "leave"; // 'leave', 'remove', 'ban'

  if (!userEmail) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  try {
    // If removing/banning someone else, check permissions
    if (targetEmail !== userEmail) {
      const { data: userMembership } = await db
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_email", userEmail)
        .single();

      if (!userMembership || !["creator", "admin", "moderator"].includes(userMembership.role)) {
        return NextResponse.json({ error: "Not authorized to remove members" }, { status: 403 });
      }

      // Check target's role - can't remove someone with equal or higher role
      const { data: targetMembership } = await db
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_email", targetEmail)
        .single();

      if (targetMembership) {
        const rolePriority: Record<string, number> = {
          creator: 0,
          admin: 1,
          moderator: 2,
          member: 3,
        };

        if ((rolePriority[targetMembership.role] ?? 4) <= (rolePriority[userMembership.role] ?? 4)) {
          return NextResponse.json(
            { error: "Cannot remove someone with equal or higher role" },
            { status: 403 }
          );
        }
      }
    }

    // Check if target is the creator (can't leave or be removed)
    const { data: targetMembership } = await db
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_email", targetEmail)
      .single();

    if (targetMembership?.role === "creator" && targetEmail === userEmail) {
      return NextResponse.json(
        { error: "The creator cannot leave the group. Transfer ownership or delete the group instead." },
        { status: 400 }
      );
    }

    // Perform the action
    if (action === "ban") {
      const { error } = await db
        .from("group_members")
        .update({ status: "banned" })
        .eq("group_id", groupId)
        .eq("user_email", targetEmail);

      if (error) throw error;
    } else {
      const { error } = await db
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_email", targetEmail);

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: action === "ban" ? "Member banned" : targetEmail === userEmail ? "Left group" : "Member removed",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

// PATCH /api/groups/[groupId]/members - Update member role or approve request
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { user_email, target_email, action, new_role } = body;

    if (!user_email || !target_email) {
      return NextResponse.json({ error: "User email and target email required" }, { status: 400 });
    }

    // Check user's permission
    const { data: userMembership } = await db
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_email", user_email)
      .single();

    if (!userMembership || !["creator", "admin"].includes(userMembership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "approve") {
      // Approve pending request
      const { error } = await db
        .from("group_members")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .eq("user_email", target_email)
        .eq("status", "pending");

      if (error) throw error;

      // Notify the user
      await db.from("notifications").insert({
        user_email: target_email,
        type: "group_request_approved",
        actor_email: user_email,
        title: "Join request approved",
        body: "Your request to join the group has been approved",
        link: `/groups/${groupId}`,
      });

      return NextResponse.json({ success: true, message: "Request approved" });
    }

    if (action === "reject") {
      // Reject pending request
      const { error } = await db
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_email", target_email)
        .eq("status", "pending");

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Request rejected" });
    }

    if (action === "change_role" && new_role) {
      // Validate new role
      const validRoles = ["admin", "moderator", "member"];
      if (!validRoles.includes(new_role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Only creator can promote to admin
      if (new_role === "admin" && userMembership.role !== "creator") {
        return NextResponse.json({ error: "Only the creator can promote to admin" }, { status: 403 });
      }

      const { error } = await db
        .from("group_members")
        .update({ role: new_role })
        .eq("group_id", groupId)
        .eq("user_email", target_email);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Role updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
