import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Extend timeout to 60 seconds
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { name, course, skills, interests, experience, goal } = await request.json();

    if (!name || !course || !interests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are an AI internship coach for Singapore students. Generate interview prep content.

Student: ${name}, studying ${course}. Skills: ${skills || "general"}. Interests: ${interests}. Experience: ${experience || "student"}. Goal: ${goal || "internship"}.

Return ONLY valid JSON with these keys (be concise):

{
  "career_suggestions": [3 objects with: "role", "skills_needed" (3 skills), "internship_types" (2 types), "resources" (2 resources), "why_good_fit"],
  "mock_interview_questions": [4 objects with: "question", "type", "tip", "skill_tested"],
  "ai_feedback_examples": [4 objects with: "example_answer" (50 words), "feedback": {"structure_clarity", "confidence_tone", "role_relevance", "improvements" (2 items)}, "score"],
  "resume_suggestions": {"bullet_points" (3), "formatting_tips" (2), "common_mistakes" (2)},
  "cover_letter": "150 word cover letter",
  "prep_tips": [3 objects with: "tip", "why_it_matters", "action_step"],
  "dashboard_recommendations": {"mock_interviews_target": 5, "applications_target": 10, "milestones" (3), "weekly_goals" (2), "next_actions" (2)},
  "reflection_prompts": [2 objects with: "prompt", "purpose"],
  "soft_skills_focus": [2 objects with: "skill", "why_important", "how_to_develop"]
}

Singapore context. No markdown, just JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate: ${errorMessage}` },
      { status: 500 }
    );
  }
}
