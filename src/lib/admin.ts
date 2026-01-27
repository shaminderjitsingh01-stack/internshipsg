import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Get admin emails from environment variable
export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  return adminEmails.split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
}

// Check if an email is an admin
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

// Get session and check admin status for API routes
export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { session: null, isAdmin: false, error: "Not authenticated" };
  }

  const isAdmin = isAdminEmail(session.user.email);

  if (!isAdmin) {
    return { session, isAdmin: false, error: "Not authorized" };
  }

  return { session, isAdmin: true, error: null };
}

// User interface for Supabase
export interface User {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  auth_provider: string | null;
  role: string;
  subscription_tier: string;
  created_at: string;
  last_login_at: string | null;
}
