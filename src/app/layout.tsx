import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internship.sg | AI Interview Prep for Singapore Students",
  description: "Prepare for internship interviews with AI-powered mock interviews, resume tips, and career recommendations for Singapore students.",
  keywords: "internship singapore, interview prep, mock interview, resume tips, cover letter, student jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
