import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Not authenticated
    if (!token?.email) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const userEmail = (token.email as string).toLowerCase();

    if (!adminEmails.includes(userEmail)) {
      // Not an admin - redirect to dashboard with message
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
