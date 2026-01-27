"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <img src="/logo.png" alt="Internship.sg" className="h-8 w-auto" />
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">ADMIN</span>
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Users
            </Link>
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Exit Admin
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "Admin"}
                className="w-8 h-8 rounded-full border-2 border-slate-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user?.name?.charAt(0) || "A"}
                </span>
              </div>
            )}
            <span className="text-slate-300 text-sm">{session.user?.email}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
