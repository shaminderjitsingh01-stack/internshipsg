import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        if (!isSupabaseConfigured()) {
          throw new Error("Database not configured");
        }

        // Find user by email
        const { data: user, error } = await supabase
          .from("user accounts")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) {
          throw new Error("Invalid email or password");
        }

        // Check if user has a password (might be Google-only user)
        if (!user.password_hash) {
          throw new Error("Please sign in with Google or reset your password");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image_url,
        };
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
            .from("user accounts")
            .select("id")
            .eq("email", user.email)
            .single();

          if (existingUser) {
            // Update last login
            await supabase
              .from("user accounts")
              .update({ last_login_at: new Date().toISOString() })
              .eq("email", user.email);
          } else {
            // Create new user
            await supabase.from("user accounts").insert({
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
