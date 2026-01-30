import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Get all available plans
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return default plans if database not configured
    return NextResponse.json({
      plans: [
        {
          id: "free",
          name: "free",
          price_monthly: 0,
          price_yearly: 0,
          features: ["5 AI interviews/month", "Basic analytics", "Public profile"],
        },
        {
          id: "pro",
          name: "pro",
          price_monthly: 9.99,
          price_yearly: 99,
          features: ["Unlimited AI interviews", "Advanced analytics", "Resume builder", "Priority support", "No ads", "Profile badge"],
        },
        {
          id: "premium",
          name: "premium",
          price_monthly: 19.99,
          price_yearly: 199,
          features: ["Everything in Pro", "1-on-1 coaching session", "Company insights", "Salary data", "Interview recordings", "Custom branding"],
        },
      ],
    });
  }

  try {
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error("Get plans error:", error);
    return NextResponse.json({ error: "Failed to get plans" }, { status: 500 });
  }
}
