import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// GET - Fetch single post with comments and author info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { postId } = await params;
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("email");

  try {
    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .is("deleted_at", null)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch author info
    const [profileRes, accountRes] = await Promise.all([
      supabase.from("profiles").select("email, username, display_name, school, bio").eq("email", post.author_email).single(),
      supabase.from("user accounts").select("email, name, image_url, tier, level").eq("email", post.author_email).single(),
    ]);

    // Fetch user's reaction if logged in
    let userReaction = null;
    if (userEmail) {
      const { data: reaction } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", postId)
        .eq("user_email", userEmail)
        .single();
      userReaction = reaction?.reaction_type || null;
    }

    // Check if bookmarked
    let isBookmarked = false;
    if (userEmail) {
      const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("post_id", postId)
        .eq("user_email", userEmail)
        .single();
      isBookmarked = !!bookmark;
    }

    // Fetch all comments with replies
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
    }

    // Get all comment author emails
    const commentAuthorEmails = [...new Set(comments?.map(c => c.author_email) || [])];

    // Fetch comment authors info
    let commentAuthors: Record<string, any> = {};
    if (commentAuthorEmails.length > 0) {
      const [commentProfilesRes, commentAccountsRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name").in("email", commentAuthorEmails),
        supabase.from("user accounts").select("email, name, image_url, tier").in("email", commentAuthorEmails),
      ]);

      commentAuthorEmails.forEach(email => {
        const profile = commentProfilesRes.data?.find(p => p.email === email);
        const account = commentAccountsRes.data?.find(a => a.email === email);
        commentAuthors[email] = {
          email,
          username: profile?.username,
          name: profile?.display_name || account?.name || "Anonymous",
          image: account?.image_url,
          tier: account?.tier,
        };
      });
    }

    // Organize comments into nested structure
    const topLevelComments = comments?.filter(c => !c.parent_comment_id) || [];
    const replies = comments?.filter(c => c.parent_comment_id) || [];

    const enrichedComments = topLevelComments.map(comment => ({
      ...comment,
      author: commentAuthors[comment.author_email] || { email: comment.author_email, name: "Anonymous" },
      replies: replies
        .filter(r => r.parent_comment_id === comment.id)
        .map(reply => ({
          ...reply,
          author: commentAuthors[reply.author_email] || { email: reply.author_email, name: "Anonymous" },
        })),
    }));

    // Fetch related posts (by same author or similar hashtags)
    let relatedPosts: any[] = [];

    // Extract hashtags from post content
    const hashtags = post.content.match(/#[\w]+/g) || [];

    // Get posts by same author (excluding current post)
    const { data: authorPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("author_email", post.author_email)
      .neq("id", postId)
      .is("deleted_at", null)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(3);

    if (authorPosts) {
      relatedPosts.push(...authorPosts);
    }

    // If we have hashtags, get posts with similar hashtags
    if (hashtags.length > 0 && relatedPosts.length < 5) {
      const cleanTags = hashtags.map((t: string) => t.toLowerCase());

      // Get hashtag IDs
      const { data: hashtagData } = await supabase
        .from("hashtags")
        .select("id")
        .in("tag", cleanTags.map((t: string) => t.replace("#", "")));

      if (hashtagData && hashtagData.length > 0) {
        const hashtagIds = hashtagData.map(h => h.id);

        // Get posts with these hashtags
        const { data: hashtagPosts } = await supabase
          .from("post_hashtags")
          .select("post_id")
          .in("hashtag_id", hashtagIds);

        if (hashtagPosts && hashtagPosts.length > 0) {
          const existingIds = [postId, ...relatedPosts.map(p => p.id)];
          const newPostIds = hashtagPosts
            .map(hp => hp.post_id)
            .filter(id => !existingIds.includes(id))
            .slice(0, 5 - relatedPosts.length);

          if (newPostIds.length > 0) {
            const { data: additionalPosts } = await supabase
              .from("posts")
              .select("*")
              .in("id", newPostIds)
              .is("deleted_at", null)
              .eq("visibility", "public");

            if (additionalPosts) {
              relatedPosts.push(...additionalPosts);
            }
          }
        }
      }
    }

    // Enrich related posts with author info
    if (relatedPosts.length > 0) {
      const relatedAuthorEmails = [...new Set(relatedPosts.map(p => p.author_email))];
      const [relatedProfilesRes, relatedAccountsRes] = await Promise.all([
        supabase.from("profiles").select("email, username, display_name, school").in("email", relatedAuthorEmails),
        supabase.from("user accounts").select("email, name, image_url, tier, level").in("email", relatedAuthorEmails),
      ]);

      relatedPosts = relatedPosts.slice(0, 5).map(p => {
        const profile = relatedProfilesRes.data?.find(pr => pr.email === p.author_email);
        const account = relatedAccountsRes.data?.find(a => a.email === p.author_email);
        return {
          ...p,
          author: {
            email: p.author_email,
            username: profile?.username,
            name: profile?.display_name || account?.name || "Anonymous",
            image: account?.image_url,
            school: profile?.school,
            tier: account?.tier,
            level: account?.level,
          },
        };
      });
    }

    // Build the enriched post
    const enrichedPost = {
      ...post,
      author: {
        email: post.author_email,
        username: profileRes.data?.username,
        name: profileRes.data?.display_name || accountRes.data?.name || "Anonymous",
        image: accountRes.data?.image_url,
        school: profileRes.data?.school,
        bio: profileRes.data?.bio,
        tier: accountRes.data?.tier,
        level: accountRes.data?.level,
      },
      userReaction,
      isBookmarked,
    };

    return NextResponse.json({
      post: enrichedPost,
      comments: enrichedComments,
      relatedPosts,
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
