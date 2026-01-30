import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Get user's current subscription
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("user_email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // If no subscription, return free plan
    if (!subscription) {
      const { data: freePlan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("name", "free")
        .single();

      return NextResponse.json({
        subscription: null,
        plan: freePlan || { name: "free", features: [] },
        isActive: true,
      });
    }

    const isActive = subscription.status === "active" &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

    return NextResponse.json({
      subscription,
      plan: subscription.plan,
      isActive,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json({ error: "Failed to get subscription" }, { status: 500 });
  }
}
