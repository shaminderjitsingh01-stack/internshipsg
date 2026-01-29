import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// POST /api/companies/[companyId]/follow - Follow a company
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { companyId } = await params;

  try {
    const body = await request.json();
    const { user_email } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("company_followers")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_email", user_email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already following this company" }, { status: 409 });
    }

    // Add follow
    const { error } = await supabase
      .from("company_followers")
      .insert({
        company_id: companyId,
        user_email,
      });

    if (error) throw error;

    // Update follower count
    await supabase.rpc("increment_company_followers", { company_id_param: companyId });

    return NextResponse.json({ success: true, message: "Now following company" });
  } catch (error) {
    console.error("Error following company:", error);
    return NextResponse.json(
      { error: "Failed to follow company" },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[companyId]/follow - Unfollow a company
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { companyId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Remove follow
    const { error } = await supabase
      .from("company_followers")
      .delete()
      .eq("company_id", companyId)
      .eq("user_email", userEmail);

    if (error) throw error;

    // Update follower count
    await supabase.rpc("decrement_company_followers", { company_id_param: companyId });

    return NextResponse.json({ success: true, message: "Unfollowed company" });
  } catch (error) {
    console.error("Error unfollowing company:", error);
    return NextResponse.json(
      { error: "Failed to unfollow company" },
      { status: 500 }
    );
  }
}
