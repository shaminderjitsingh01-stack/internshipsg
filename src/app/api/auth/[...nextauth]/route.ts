import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Resend } from "resend";

// Custom adapter for storing verification tokens in Supabase
const customAdapter = {
  async createVerificationToken({ identifier, expires, token }: { identifier: string; expires: Date; token: string }) {
    if (!isSupabaseConfigured()) return { identifier, expires, token };

    await supabase.from("verification_tokens").insert({
      identifier,
      token,
      expires: expires.toISOString(),
    });
    return { identifier, expires, token };
  },
  async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
    if (!isSupabaseConfigured()) return null;

    const { data } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("identifier", identifier)
      .eq("token", token)
      .single();

    if (data) {
      await supabase
        .from("verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token);
      return { identifier: data.identifier, expires: new Date(data.expires), token: data.token };
    }
    return null;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: isSupabaseConfigured() ? customAdapter as any : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM || "Internship.sg <noreply@internship.sg>",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        try {
          await resend.emails.send({
            from: provider.from || "Internship.sg <noreply@internship.sg>",
            to: email,
            subject: "Sign in to Internship.sg",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #dc2626; margin: 0; font-size: 24px;">Internship.sg</h1>
                  <p style="color: #64748b; margin-top: 8px;">AI-Powered Interview Prep</p>
                </div>
                <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
                  <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Sign in to your account</h2>
                  <p style="color: #64748b; margin: 0 0 24px 0;">Click the button below to securely sign in. This link expires in 24 hours.</p>
                  <a href="${url}" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Sign In</a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Error sending magic link email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Save or update user in database on sign in
      if (user?.email && isSupabaseConfigured()) {
        try {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", user.email)
            .single();

          if (existingUser) {
            // Update last login
            await supabase
              .from("users")
              .update({ last_login_at: new Date().toISOString() })
              .eq("email", user.email);
          } else {
            // Create new user
            await supabase.from("users").insert({
              email: user.email,
              name: user.name || null,
              image_url: user.image || null,
              auth_provider: account?.provider || "credentials",
              role: "user",
              subscription_tier: "free",
            });
          }
        } catch (error) {
          console.error("Error saving user to database:", error);
          // Don't block sign in if database save fails
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
