import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { profile, resumeText, coverLetterText, interviewTranscript } = await request.json();

    // Format interview transcript
    const formattedTranscript = interviewTranscript
      .map((msg: Message) => `${msg.role === "assistant" ? "Interviewer" : "Candidate"}: ${msg.content}`)
      .join("\n\n");

    const prompt = `You are an expert career coach analyzing a candidate's internship application materials and mock interview performance.

CANDIDATE PROFILE:
- Name: ${profile.name}
- Target Role: ${profile.targetRole}
- Experience: ${profile.experience}

RESUME:
${resumeText}

COVER LETTER:
${coverLetterText}

MOCK INTERVIEW TRANSCRIPT:
${formattedTranscript}

Analyze all materials and provide feedback in this exact JSON format:

{
  "resumeTips": ["tip1", "tip2", "tip3", "tip4"],
  "coverLetterTips": ["tip1", "tip2", "tip3", "tip4"],
  "prepTips": ["tip1", "tip2", "tip3", "tip4"],
  "softSkills": [
    {"skill": "skill name", "tip": "how to improve"},
    {"skill": "skill name", "tip": "how to improve"},
    {"skill": "skill name", "tip": "how to improve"}
  ],
  "interviewScore": 7,
  "interviewFeedback": "2-3 sentence overall feedback on interview performance"
}

Guidelines:
- Resume tips: Focus on formatting, keywords, quantifiable achievements, ATS optimization
- Cover letter tips: Focus on structure, hook, specificity, call-to-action
- Prep tips: Actionable interview preparation advice based on their performance
- Soft skills: Skills they should develop based on their interview answers
- Interview score: 1-10 based on answer quality, structure, and confidence
- Be specific and actionable, not generic
- Singapore internship market context

Return ONLY valid JSON, no markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
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
    console.error("Analyze API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
