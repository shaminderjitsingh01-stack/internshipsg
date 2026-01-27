"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useTheme } from "@/context/ThemeContext";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const { isDarkTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Failed to send magic link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  // Show success message after email is sent
  if (emailSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
        <div className="w-full max-w-md text-center">
          <div className={`rounded-2xl shadow-lg p-8 ${isDarkTheme ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Check your email</h2>
            <p className={`mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              We sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
            </p>
            <p className={`text-sm mb-6 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              The link will expire in 24 hours. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="text-red-500 font-medium hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.png" alt="Internship.sg" className={`h-12 w-auto mx-auto mb-4 ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>
          <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Welcome to Internship.sg</h1>
          <p className={`mt-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Sign in to start your interview prep</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl shadow-lg p-8 ${isDarkTheme ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
          {/* Error Message */}
          {(error || formError) && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {formError || "Authentication failed. Please try again."}
            </div>
          )}

          {/* Google Sign In - Primary */}
          <button
            onClick={handleGoogleSignIn}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all mb-4 border-2 ${isDarkTheme ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDarkTheme ? 'border-white/10' : 'border-slate-200'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-3 ${isDarkTheme ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-500'}`}>or</span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all ${isDarkTheme ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'border border-slate-200'}`}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending link...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          <p className={`text-xs text-center mt-4 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
            We'll email you a magic link for password-free sign in
          </p>
        </div>

        {/* Footer */}
        <p className={`text-center text-sm mt-8 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
