import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface EmployerWaitlistEntry {
  id: string;
  email: string;
  company_name: string;
  contact_name: string | null;
  role: string | null;
  company_size: string | null;
  message: string | null;
  is_work_email: boolean;
  contacted: boolean;
  contacted_at: string | null;
  notes: string | null;
  created_at: string;
}

// GET: List all employer waitlist entries
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all"; // all, contacted, not_contacted
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    // Return mock data for development
    return NextResponse.json({
      employers: getMockEmployers(),
      total: 15,
      page,
      limit,
      totalPages: 1,
    });
  }

  try {
    let query = supabase
      .from("employer_waitlist")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,company_name.ilike.%${search}%,contact_name.ilike.%${search}%`
      );
    }

    if (filter === "contacted") {
      query = query.eq("contacted", true);
    } else if (filter === "not_contacted") {
      query = query.eq("contacted", false);
    }

    const { data: employers, count, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    return NextResponse.json({
      employers: employers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching employer waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer waitlist" },
      { status: 500 }
    );
  }
}

// PATCH: Update an employer waitlist entry (mark contacted, add notes)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, contacted, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Updated (mock)" });
    }

    const updateData: any = {};

    if (typeof contacted === "boolean") {
      updateData.contacted = contacted;
      updateData.contacted_at = contacted ? new Date().toISOString() : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { error: updateError } = await supabase
      .from("employer_waitlist")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating employer waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an employer from waitlist
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await getAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Deleted (mock)" });
    }

    const { error: deleteError } = await supabase
      .from("employer_waitlist")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting employer waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}

function getMockEmployers(): EmployerWaitlistEntry[] {
  return [
    {
      id: "1",
      email: "hr@grab.com",
      company_name: "Grab",
      contact_name: "Sarah Tan",
      role: "HR Manager",
      company_size: "1000+",
      message: "Looking to hire interns for our engineering team",
      is_work_email: true,
      contacted: true,
      contacted_at: "2024-01-15T10:00:00Z",
      notes: "Scheduled call for next week",
      created_at: "2024-01-10T08:00:00Z",
    },
    {
      id: "2",
      email: "recruiting@shopee.sg",
      company_name: "Shopee",
      contact_name: "Michael Lee",
      role: "Talent Acquisition",
      company_size: "1000+",
      message: "Interested in bulk hiring for summer internship program",
      is_work_email: true,
      contacted: false,
      contacted_at: null,
      notes: null,
      created_at: "2024-01-12T14:30:00Z",
    },
    {
      id: "3",
      email: "careers@dbs.com",
      company_name: "DBS Bank",
      contact_name: "Jennifer Wong",
      role: "Campus Recruitment Lead",
      company_size: "1000+",
      message: "Want to explore partnership for our graduate program",
      is_work_email: true,
      contacted: true,
      contacted_at: "2024-01-18T09:00:00Z",
      notes: "Sent proposal, awaiting response",
      created_at: "2024-01-14T11:20:00Z",
    },
    {
      id: "4",
      email: "hello@startup.io",
      company_name: "TechStartup",
      contact_name: "Alex Chen",
      role: "Founder",
      company_size: "11-50",
      message: "Early stage startup looking for hungry interns",
      is_work_email: true,
      contacted: false,
      contacted_at: null,
      notes: null,
      created_at: "2024-01-16T16:45:00Z",
    },
    {
      id: "5",
      email: "talent@bytedance.com",
      company_name: "ByteDance",
      contact_name: "David Lim",
      role: "University Relations",
      company_size: "1000+",
      message: "Expanding our SG office, need quality candidates",
      is_work_email: true,
      contacted: false,
      contacted_at: null,
      notes: null,
      created_at: "2024-01-17T13:00:00Z",
    },
  ];
}
