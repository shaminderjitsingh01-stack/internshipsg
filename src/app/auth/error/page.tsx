"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useTheme } from "@/context/ThemeContext";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { isDarkTheme } = useTheme();

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration. Please contact support.",
    AccessDenied: "Access was denied. You may not have permission to sign in.",
    Verification: "The verification link has expired or has already been used.",
    OAuthSignin: "Error starting the OAuth sign-in flow. Please try again.",
    OAuthCallback: "Error during OAuth callback. Please check your Google Cloud Console settings.",
    OAuthCreateAccount: "Could not create an account with your OAuth provider.",
    EmailCreateAccount: "Could not create an account with your email.",
    Callback: "Error during callback. Please try again.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    EmailSignin: "Error sending the email sign-in link.",
    CredentialsSignin: "Invalid credentials. Please check your username and password.",
    SessionRequired: "Please sign in to access this page.",
    Default: "An authentication error occurred. Please try again.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkTheme ? 'bg-slate-950' : 'bg-gradient-to-br from-red-50 to-white'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-lg p-8 text-center ${isDarkTheme ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Authentication Error</h1>
        <p className={`mb-6 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{errorMessage}</p>
        {error && (
          <p className={`text-sm mb-6 font-mono p-2 rounded ${isDarkTheme ? 'text-slate-500 bg-slate-800' : 'text-slate-400 bg-slate-100'}`}>
            Error code: {error}
          </p>
        )}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
