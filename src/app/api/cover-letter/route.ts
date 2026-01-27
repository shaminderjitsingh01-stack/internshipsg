import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { mode, jobDescription, companyName, resumeText, coverLetterText } = await request.json();

    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a valid job description" },
        { status: 400 }
      );
    }

    if (mode === "generate") {
      // Generate a new cover letter
      const prompt = `You are an expert career coach helping Singapore students write compelling cover letters for internships.

JOB DESCRIPTION:
${jobDescription}

COMPANY NAME: ${companyName || "the company"}

CANDIDATE'S RESUME:
${resumeText || "No resume provided - create a general but compelling cover letter"}

Write a professional cover letter and return in this exact JSON format:

{
  "coverLetter": "Full cover letter text here with proper paragraphs separated by \\n\\n",
  "keyPoints": [
    "Key point addressed in the letter",
    "Another key point",
    "Third key point"
  ],
  "customizationNotes": "How this letter is specifically tailored to the role and company",
  "wordCount": 280,
  "tone": "Professional yet personable"
}

Guidelines:
- Write 250-350 words
- Open with a compelling hook (not "I am writing to apply...")
- Connect specific experiences from resume to job requirements
- Show genuine interest in the company
- End with a confident call-to-action
- Use professional but warm Singapore English
- Make it specific to internship applications
- Include 2-3 specific examples or achievements

Return ONLY valid JSON, no markdown.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
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

      return NextResponse.json({ mode: "generate", ...parsedResponse });

    } else if (mode === "analyze") {
      // Analyze an existing cover letter
      if (!coverLetterText || coverLetterText.trim().length < 50) {
        return NextResponse.json(
          { error: "Please provide a cover letter to analyze" },
          { status: 400 }
        );
      }

      const prompt = `You are an expert career coach analyzing a cover letter for a Singapore internship application.

COVER LETTER:
${coverLetterText}

JOB DESCRIPTION:
${jobDescription}

COMPANY NAME: ${companyName || "Unknown"}

Analyze this cover letter and return feedback in this exact JSON format:

{
  "overallScore": 75,
  "toneAnalysis": {
    "score": 80,
    "description": "Professional/Casual/Formal",
    "feedback": "Brief feedback on tone"
  },
  "customizationScore": {
    "score": 70,
    "feedback": "How well it's tailored to the specific job"
  },
  "structureAnalysis": {
    "score": 75,
    "hasStrongOpening": true,
    "hasCallToAction": true,
    "feedback": "Brief feedback on structure"
  },
  "contentAnalysis": {
    "specificity": 70,
    "relevanceToJob": 75,
    "achievementsMentioned": 2,
    "feedback": "Brief feedback on content quality"
  },
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "improvements": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ],
  "missingElements": [
    "Element that should be included"
  ],
  "rewriteSuggestions": {
    "opening": "Suggested better opening line",
    "closing": "Suggested better closing line"
  },
  "wordCount": 250,
  "readabilityScore": 80
}

Guidelines:
- Score each aspect 0-100
- Be specific and actionable in feedback
- Consider Singapore internship market expectations
- Check if it addresses key job requirements
- Evaluate the hook/opening line
- Check for a clear call-to-action
- Identify generic vs specific content

Return ONLY valid JSON, no markdown.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
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

      return NextResponse.json({ mode: "analyze", ...parsedResponse });

    } else {
      return NextResponse.json(
        { error: "Invalid mode. Use 'generate' or 'analyze'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Cover Letter API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Operation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
