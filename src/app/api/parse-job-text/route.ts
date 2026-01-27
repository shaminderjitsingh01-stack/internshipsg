import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Job description text is required (minimum 100 characters)" },
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
          content: `Extract and structure this job description. Return ONLY valid JSON (no markdown, no explanation):

Job Description Text:
${text.slice(0, 10000)}

Return this exact JSON format:
{
  "title": "Job Title (extract from text or infer)",
  "company": "Company Name (extract from text or use 'Not specified')",
  "description": "The full job description text, cleaned up",
  "requirements": {
    "nonNegotiable": ["requirement 1", "requirement 2"],
    "goodToHave": ["nice to have 1", "nice to have 2"]
  }
}

For requirements classification:
- nonNegotiable: Required qualifications, must-have skills, mandatory experience, educational requirements (words like "required", "must have", "minimum", "essential")
- goodToHave: Preferred qualifications, bonus skills, nice-to-have experience (words like "preferred", "nice to have", "bonus", "plus")

Extract ALL requirements mentioned. Be thorough.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let jobDescription;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobDescription = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: "Could not parse job description structure" },
        { status: 400 }
      );
    }

    return NextResponse.json({ jobDescription });
  } catch (error: any) {
    console.error("Error parsing job text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse job description" },
      { status: 500 }
    );
  }
}
