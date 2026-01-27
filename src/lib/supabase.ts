import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create client only if credentials are available
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export const isSupabaseConfigured = () => {
  return supabaseUrl !== "" && supabaseAnonKey !== "";
};

// Database types
export interface Interview {
  id: string;
  user_email: string;
  user_name: string;
  target_role: string;
  video_url: string | null;
  transcript: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}
