import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        action: { label: "Action", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const email = credentials.email;
        const password = credentials.password;
        const name = credentials.name || email.split("@")[0];

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        return {
          id: email,
          email: email,
          name: name,
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
