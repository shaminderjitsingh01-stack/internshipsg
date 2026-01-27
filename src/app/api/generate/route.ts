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

    const prompt = `You are a top-tier AI internship coach for Singapore students. You provide personalized, actionable guidance that addresses common gaps in AI interview tools:
- Generic questions & shallow feedback
- Lack of internship-specific scenarios
- No structured progress or roadmap
- Minimal actionable suggestions
- Limited soft skills coaching

Student Profile:
- Name: ${name}
- Course / Degree: ${course}
- Skills & Projects: ${skills || "Not specified"}
- Interests / Preferred Internship Roles: ${interests}
- Experience Level: ${experience || "None"}
- Goal: ${goal || "Get an internship in Singapore"}

Generate ALL outputs in valid JSON format with these exact keys:

1. "career_suggestions": Array of 3-5 internship roles tailored to Singapore market. Each object:
   - "role": Role name
   - "skills_needed": Array of 4-6 key skills
   - "internship_types": Array of 2-3 specific company types/sectors in Singapore
   - "resources": Array of 2-3 actionable resources (LinkedIn Learning, specific YouTube channels, Singapore career portals like MyCareersFuture, InternSG)
   - "why_good_fit": Brief explanation why this role suits the student

2. "mock_interview_questions": Array of 6-8 internship-specific questions. Each object:
   - "question": The interview question (tailored to their role interest)
   - "type": "behavioral" | "situational" | "technical" | "knowledge"
   - "tip": Quick answering tip
   - "skill_tested": What skill this question evaluates

3. "ai_feedback_examples": Array matching mock_interview_questions. Each object:
   - "example_answer": A realistic student-level answer (150-200 words)
   - "feedback": Object with:
     - "structure_clarity": Feedback on answer structure (1-2 sentences)
     - "confidence_tone": Feedback on confidence and tone (1-2 sentences)
     - "role_relevance": How relevant to the internship role (1-2 sentences)
     - "improvements": Array of 2-3 specific, actionable improvements with WHY they matter
   - "score": Number 1-10 with brief justification

4. "resume_suggestions": Object with:
   - "bullet_points": Array of 4-5 ready-to-use resume bullet points using their actual skills/projects. Use action verbs and quantify where possible.
   - "formatting_tips": Array of 3 formatting best practices
   - "common_mistakes": Array of 2-3 mistakes Singapore students often make

5. "cover_letter": A 200-250 word tailored cover letter with clear structure:
   - Opening hook (not "I am writing to apply...")
   - Why this role/company excites them
   - 1-2 relevant experiences/skills
   - Confident closing with call-to-action
   Professional but student-friendly tone.

6. "prep_tips": Array of 5 actionable tips. Each object:
   - "tip": The preparation tip
   - "why_it_matters": Why this is important for Singapore internships
   - "action_step": Specific next action to take

7. "dashboard_recommendations": Object with:
   - "mock_interviews_target": Number (recommended practice sessions)
   - "applications_target": Number (recommended applications to send)
   - "milestones": Array of 5 preparation milestones in order
   - "weekly_goals": Array of 3 weekly goals to stay on track
   - "next_actions": Array of 3 immediate next steps

8. "reflection_prompts": Array of 3 self-reflection prompts to help identify learning gaps. Each object:
   - "prompt": The reflection question
   - "purpose": Why this reflection helps

9. "soft_skills_focus": Array of 3 soft skills to develop. Each object:
   - "skill": Skill name
   - "why_important": Why it matters for this role
   - "how_to_develop": Practical way to develop it

Return ONLY valid JSON, no markdown code blocks, no explanation text. Ensure all content is specific to Singapore context (local companies, job portals, cultural norms).`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
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
