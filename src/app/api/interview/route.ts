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
    const { messages, userProfile, action } = await request.json();

    // Start new interview
    if (action === "start") {
      const systemPrompt = `You are an experienced interviewer conducting a mock interview for a Singapore internship candidate.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Course: ${userProfile?.course || "University Student"}
- Skills: ${userProfile?.skills || "General skills"}
- Interests: ${userProfile?.interests || "Various roles"}

IMPORTANT RULES:
1. Ask ONE question at a time
2. Wait for the candidate's response before asking the next question
3. Be encouraging but professional
4. Ask 5 questions total, mixing behavioral, situational, and role-specific questions
5. After the 5th answer, provide comprehensive feedback

Start by greeting the candidate briefly and asking your first interview question.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: "Start the interview" }],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";

      return NextResponse.json({
        message: responseText,
        questionNumber: 1,
        isComplete: false,
      });
    }

    // Continue interview
    if (action === "respond") {
      const questionCount = messages.filter((m: Message) => m.role === "assistant").length;
      const isLastQuestion = questionCount >= 5;

      const systemPrompt = `You are an experienced interviewer conducting a mock interview for a Singapore internship candidate.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Course: ${userProfile?.course || "University Student"}
- Skills: ${userProfile?.skills || "General skills"}
- Interests: ${userProfile?.interests || "Various roles"}

This is question ${questionCount + 1} of 5.

RULES:
${isLastQuestion ? `
This was the FINAL question. Now provide comprehensive feedback:
1. Overall Performance Score (1-10)
2. Strengths (2-3 points)
3. Areas for Improvement (2-3 points)
4. Specific Tips for each answer
5. Encouragement for their internship journey

Format the feedback clearly with headers.
` : `
1. Briefly acknowledge their answer (1 sentence)
2. Ask your next interview question
3. Keep it professional and encouraging
4. Mix question types: behavioral, situational, technical, motivational
`}`;

      const apiMessages = messages.map((m: Message) => ({
        role: m.role,
        content: m.content,
      }));

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: isLastQuestion ? 1500 : 500,
        system: systemPrompt,
        messages: apiMessages,
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";

      return NextResponse.json({
        message: responseText,
        questionNumber: questionCount + 1,
        isComplete: isLastQuestion,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Interview API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Interview error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
