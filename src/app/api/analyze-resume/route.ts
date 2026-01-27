import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeText, targetRole } = await request.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a valid resume with more content" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert resume reviewer specializing in Singapore's internship and job market.

RESUME TEXT:
${resumeText}

TARGET ROLE: ${targetRole || "General internship position"}

Analyze this resume thoroughly and return feedback in this exact JSON format:

{
  "overallScore": 75,
  "atsScore": 80,
  "keywordAnalysis": {
    "found": ["keyword1", "keyword2", "keyword3"],
    "missing": ["keyword1", "keyword2"],
    "industryRelevance": 75
  },
  "sectionFeedback": {
    "contactInfo": {
      "score": 90,
      "feedback": "Brief feedback on contact section",
      "suggestions": ["suggestion1"]
    },
    "summary": {
      "score": 70,
      "feedback": "Brief feedback on summary/objective",
      "suggestions": ["suggestion1", "suggestion2"]
    },
    "experience": {
      "score": 75,
      "feedback": "Brief feedback on work experience",
      "suggestions": ["suggestion1", "suggestion2"]
    },
    "education": {
      "score": 85,
      "feedback": "Brief feedback on education section",
      "suggestions": ["suggestion1"]
    },
    "skills": {
      "score": 70,
      "feedback": "Brief feedback on skills section",
      "suggestions": ["suggestion1", "suggestion2"]
    }
  },
  "formattingIssues": ["issue1", "issue2"],
  "topImprovements": [
    "Most important improvement needed",
    "Second most important",
    "Third most important"
  ],
  "strengths": [
    "Key strength 1",
    "Key strength 2",
    "Key strength 3"
  ],
  "actionVerbs": {
    "strong": ["verb1", "verb2"],
    "weak": ["verb1", "verb2"],
    "suggestions": ["better verb options"]
  },
  "quantifiableAchievements": {
    "found": 2,
    "examples": ["example from resume"],
    "suggestions": ["how to add more metrics"]
  }
}

Guidelines:
- Overall score: 0-100 based on overall resume quality
- ATS score: 0-100 based on how well it would pass Applicant Tracking Systems
- Be specific to Singapore job market expectations
- Focus on actionable, specific feedback
- Identify missing keywords for the target role
- Check for quantifiable achievements (numbers, percentages, metrics)
- Evaluate action verbs strength
- Consider formatting and readability

Return ONLY valid JSON, no markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let parsedResponse;
    try {
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Resume Analysis API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
