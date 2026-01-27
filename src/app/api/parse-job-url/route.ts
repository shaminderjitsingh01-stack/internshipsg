import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extract JSON-LD structured data from HTML
function extractJsonLd(html: string): any {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [];
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "JobPosting" ||
          (Array.isArray(data) && data.some(item => item["@type"] === "JobPosting"))) {
        matches.push(data);
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return matches.length > 0 ? matches[0] : null;
}

// Extract meta tags from HTML
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Open Graph tags
  const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    meta[`og:${match[1]}`] = match[2];
  }

  // Standard meta tags
  const metaRegex = /<meta[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
  while ((match = metaRegex.exec(html)) !== null) {
    meta[match[1]] = match[2];
  }

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    meta.title = titleMatch[1];
  }

  return meta;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check for common job board URLs that typically block scraping
    const blockedDomains = ["linkedin.com", "indeed.com", "glassdoor.com"];
    const urlLower = url.toLowerCase();
    const isBlockedDomain = blockedDomains.some(domain => urlLower.includes(domain));

    // Check for JavaScript-rendered sites (like Workable)
    const jsRenderedSites = ["workable.com", "lever.co", "greenhouse.io", "smartrecruiters.com"];
    const isJsRendered = jsRenderedSites.some(domain => urlLower.includes(domain));

    // Fetch the webpage content
    let pageContent = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        if (isBlockedDomain) {
          return NextResponse.json(
            { error: `${url.includes("linkedin") ? "LinkedIn" : url.includes("indeed") ? "Indeed" : "This job board"} requires login to view job postings. Please copy and paste the job description directly.` },
            { status: 400 }
          );
        }
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      pageContent = await response.text();

      // Check if we got a login page or blocked content
      if (pageContent.includes("Sign in") && pageContent.includes("LinkedIn") ||
          pageContent.includes("authwall") ||
          pageContent.includes("login-form")) {
        return NextResponse.json(
          { error: "This job posting requires login to view. Please copy and paste the job description directly." },
          { status: 400 }
        );
      }
    } catch (fetchError: any) {
      const errorMessage = isBlockedDomain
        ? `This job board typically blocks direct access. Please copy and paste the job description directly.`
        : `Could not access the job posting URL. Please try pasting the job description directly.`;
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Try to extract JSON-LD structured data first (most reliable)
    const jsonLdData = extractJsonLd(pageContent);
    if (jsonLdData) {
      const jobData = Array.isArray(jsonLdData)
        ? jsonLdData.find(item => item["@type"] === "JobPosting")
        : jsonLdData;

      if (jobData) {
        const jobDescription = {
          title: jobData.title || "Unknown Title",
          company: jobData.hiringOrganization?.name || jobData.employerOverview || "Unknown Company",
          description: typeof jobData.description === "string"
            ? jobData.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
            : "See job posting for details",
          requirements: {
            nonNegotiable: [] as string[],
            goodToHave: [] as string[],
          },
        };

        // Extract requirements from qualifications or skills
        if (jobData.qualifications) {
          jobDescription.requirements.nonNegotiable = Array.isArray(jobData.qualifications)
            ? jobData.qualifications
            : [jobData.qualifications];
        }
        if (jobData.skills) {
          jobDescription.requirements.goodToHave = Array.isArray(jobData.skills)
            ? jobData.skills
            : [jobData.skills];
        }

        return NextResponse.json({ jobDescription });
      }
    }

    // Extract meta tags for additional context
    const metaTags = extractMetaTags(pageContent);

    // Extract text content and clean HTML
    let textContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);

    // If content is too short, it might be a JS-rendered page
    if (textContent.length < 200) {
      if (isJsRendered) {
        return NextResponse.json(
          { error: `This job board (${urlLower.includes("workable") ? "Workable" : urlLower.includes("lever") ? "Lever" : "this platform"}) requires JavaScript to display content. Please copy the job description from the page and paste it directly.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Could not extract job description from this URL. Please try pasting the description directly." },
        { status: 400 }
      );
    }

    // Add meta tag info to help Claude extract better
    if (metaTags.title || metaTags["og:title"]) {
      textContent = `Page Title: ${metaTags.title || metaTags["og:title"]}\n\n${textContent}`;
    }
    if (metaTags["og:description"]) {
      textContent = `Description: ${metaTags["og:description"]}\n\n${textContent}`;
    }

    // Use Claude to extract and structure the job description
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract the job description from this webpage content and return a structured JSON response.

Webpage content:
${textContent}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Job Title",
  "company": "Company Name",
  "description": "Full job description text",
  "requirements": {
    "nonNegotiable": ["requirement 1", "requirement 2"],
    "goodToHave": ["nice to have 1", "nice to have 2"]
  }
}

For requirements:
- nonNegotiable: Must-have qualifications, required experience, mandatory skills, educational requirements
- goodToHave: Preferred qualifications, bonus skills, nice-to-have experience

If you cannot find certain information, use reasonable defaults or empty arrays.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let jobDescription;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobDescription = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: "Could not parse job description. Please try pasting the description directly." },
        { status: 400 }
      );
    }

    return NextResponse.json({ jobDescription });
  } catch (error: any) {
    console.error("Error parsing job URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse job URL" },
      { status: 500 }
    );
  }
}
