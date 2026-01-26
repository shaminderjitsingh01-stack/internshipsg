import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

    const prompt = `You are an expert career coach and internship recruiter for Singapore students. Generate personalized guidance for this student.

Student Profile:
- Name: ${name}
- Course / Degree: ${course}
- Skills & Projects: ${skills || "Not specified"}
- Interests / Preferred Internship Roles: ${interests}
- Experience Level: ${experience || "None"}
- Goal: ${goal || "Get an internship in Singapore"}

Generate ALL outputs in valid JSON format with these exact keys:

1. "career_suggestions": Array of 3-5 suitable internship roles. Each object should have:
   - "role": Role name
   - "skills_needed": Array of key skills
   - "internship_types": Array of suggested internship types in Singapore
   - "resources": Array of resources/guides to get started

2. "mock_interview_questions": Array of 5-8 interview questions. Each object should have:
   - "question": The interview question
   - "type": "behavioral" | "situational" | "technical" | "knowledge"
   - "tip": Quick tip for answering

3. "ai_feedback_examples": Array matching mock_interview_questions. Each object should have:
   - "example_answer": A realistic student-level answer
   - "feedback": Feedback on structure, clarity, confidence
   - "improvements": Specific suggestions to improve

4. "resume_suggestions": Object with:
   - "bullet_points": Array of 3-5 ready-to-use resume bullet points based on their skills/projects
   - "tips": Array of 3-4 formatting and phrasing tips

5. "cover_letter": A tailored cover letter (200-250 words) as a single string. Professional but student-friendly.

6. "prep_tips": Array of 5 actionable tips for interview and application preparation.

7. "dashboard_recommendations": Object with:
   - "mock_interviews_target": Recommended number of mock interviews to practice
   - "applications_target": Recommended number of applications to submit
   - "milestones": Array of 4-5 preparation milestones

Return ONLY valid JSON, no markdown code blocks, no explanation text.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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
    return NextResponse.json(
      { error: "Failed to generate career guidance" },
      { status: 500 }
    );
  }
}
