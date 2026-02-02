import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import BuildBanner from "@/components/BuildBanner";
import SharePopup from "@/components/SharePopup";
import CookieConsent from "@/components/CookieConsent";
import Analytics from "@/components/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "internship.sg - Find Internships in Singapore",
  description: "Discover thousands of internship opportunities in Singapore. Connect with top companies, get career resources, and kickstart your professional journey with internship.sg.",
  keywords: ["internship", "Singapore", "jobs", "students", "career", "employment"],
  openGraph: {
    title: "internship.sg - Find Internships in Singapore",
    description: "Discover thousands of internship opportunities in Singapore. Connect with top companies and kickstart your professional journey.",
    type: "website",
    locale: "en_SG",
    siteName: "internship.sg",
  },
  twitter: {
    card: "summary_large_image",
    title: "internship.sg - Find Internships in Singapore",
    description: "Discover thousands of internship opportunities in Singapore. Connect with top companies and kickstart your professional journey.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <BuildBanner />
            <SharePopup />
            <CookieConsent />
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
