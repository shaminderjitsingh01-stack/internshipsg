import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ postId: string }>;
  children: React.ReactNode;
};

async function getPostMetadata(postId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://internship.sg";
    const res = await fetch(`${baseUrl}/api/social/posts/${postId}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostMetadata(postId);

  if (!post) {
    return {
      title: "Post Not Found | Internship.sg",
      description: "This post may have been deleted or does not exist.",
    };
  }

  const authorName = post.author?.name || "Anonymous";
  const content = post.content || "";
  const description = content.length > 155 ? content.slice(0, 152) + "..." : content;
  const title = `${authorName} on Internship.sg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.created_at,
      authors: [authorName],
      images: post.image_url
        ? [
            {
              url: post.image_url,
              width: 1200,
              height: 630,
              alt: `Post by ${authorName}`,
            },
          ]
        : [
            {
              url: "/og-image.png",
              width: 1200,
              height: 630,
              alt: "Internship.sg",
            },
          ],
      siteName: "Internship.sg",
    },
    twitter: {
      card: post.image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: post.image_url ? [post.image_url] : ["/og-image.png"],
    },
    alternates: {
      canonical: `/post/${postId}`,
    },
  };
}

export default function PostLayout({ children }: Props) {
  return <>{children}</>;
}
