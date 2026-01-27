import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the webpage content
    let pageContent = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      pageContent = await response.text();
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: `Could not access the job posting URL. Please try pasting the job description directly.` },
        { status: 400 }
      );
    }

    // Extract text content and clean HTML
    const textContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Limit content size

    if (textContent.length < 200) {
      return NextResponse.json(
        { error: "Could not extract job description from this URL. Please try pasting the description directly." },
        { status: 400 }
      );
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
