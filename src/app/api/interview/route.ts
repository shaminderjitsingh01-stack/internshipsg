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

const TOTAL_QUESTIONS = 7;

export async function POST(request: NextRequest) {
  try {
    const { messages, userProfile, action, resumeText, coverLetterText } = await request.json();

    // Build context from resume and cover letter
    const candidateContext = `
${resumeText ? `
CANDIDATE'S RESUME:
${resumeText.substring(0, 3000)}
` : ""}
${coverLetterText ? `
CANDIDATE'S COVER LETTER:
${coverLetterText.substring(0, 1500)}
` : ""}`;

    // Start new interview
    if (action === "start") {
      const systemPrompt = `You are a friendly and professional AI interviewer conducting a mock interview for a Singapore internship candidate.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Target Role/Industry: ${userProfile?.targetRole || "Internship"}
- Experience Level: ${userProfile?.experience || "Student"}
${candidateContext}

YOUR TASK FOR THIS FIRST TURN:
Give a warm, friendly welcome to ${userProfile?.name || "the candidate"}. Be personable and help them feel at ease. Then ask your FIRST question which should be a simple ice-breaker to help them relax.

IMPORTANT: You have access to their resume and cover letter above. Use this information throughout the interview to ask personalized, relevant questions about their specific experiences, projects, skills, and aspirations mentioned in their documents.

Question Flow (${TOTAL_QUESTIONS} questions total):
1. Ice-breaker (easy, get them talking)
2. Background/Introduction (tell me about yourself - reference their resume)
3. Interest/Motivation (why this industry - connect to their cover letter)
4. Behavioral question (ask about specific experiences from their resume)
5. Industry-specific question (based on their target role and skills)
6. Situational/problem-solving question (relevant to their field)
7. Goals and wrap-up question

RULES:
- Be warm, encouraging, and conversational
- Keep your response SHORT - just the welcome and ONE question
- Don't overwhelm them with information
- Use their name to personalize
- Make them feel comfortable
- Do NOT introduce yourself by name - just be friendly and professional

Start now with your warm welcome and first ice-breaker question.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
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
      const isLastQuestion = questionCount >= TOTAL_QUESTIONS;

      const questionTypes = [
        "ice-breaker",
        "background/introduction",
        "motivation and interest",
        "behavioral",
        "industry-specific technical",
        "situational problem-solving",
        "goals and closing"
      ];

      const currentQuestionType = questionTypes[Math.min(questionCount, questionTypes.length - 1)];

      const systemPrompt = `You are a friendly AI interviewer conducting a mock interview for a Singapore internship candidate.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Target Role/Industry: ${userProfile?.targetRole || "Internship"}
- Experience Level: ${userProfile?.experience || "Student"}
${candidateContext}

Current Progress: Question ${questionCount} of ${TOTAL_QUESTIONS} completed.
${isLastQuestion ? "" : `Next question type: ${currentQuestionType}`}

${isLastQuestion ? `
THIS WAS THE FINAL QUESTION. Now provide comprehensive, encouraging feedback:

1. Start with genuine praise - they completed a full mock interview!
2. Give an Overall Score (1-10) with brief justification
3. List 2-3 Key Strengths you observed (reference specific things they said)
4. List 2-3 Areas for Improvement (be constructive, not critical)
5. Give 2-3 Specific Tips for their ${userProfile?.targetRole || "internship"} interviews
6. End with encouragement and confidence boost

Be warm and supportive in your feedback. This is practice - help them improve!
` : `
YOUR TASK:
1. Briefly acknowledge their answer (1-2 sentences, be encouraging and specific to what they said)
2. NATURALLY TRANSITION to your next question by connecting it to something they just mentioned
3. Ask your next question (type: ${currentQuestionType})

IMPORTANT - PERSONALIZE YOUR QUESTIONS:
- Reference specific projects, experiences, or skills from their resume
- Connect questions to their cover letter motivations
- Build on what they've shared in previous answers
- Make the conversation feel natural and flowing, not scripted

Question Guidelines by Type:
- Ice-breaker: Something fun/easy to build rapport
- Background: Ask about specific experiences from their resume
- Motivation: Connect to their cover letter - why this industry/company interests them
- Behavioral: "Tell me about a time when..." - reference specific projects or roles from their resume
- Industry-specific: Questions relevant to ${userProfile?.targetRole || "their field"} and their stated skills
- Situational: "What would you do if..." scenarios related to their target role
- Goals: Where they see themselves, what they hope to learn from the internship

CRITICAL RULES:
- Do NOT introduce yourself or say your name
- Do NOT repeat greetings or welcomes
- DIRECTLY acknowledge their previous answer and flow into the next question
- Keep responses SHORT and conversational
- ONE question only
- Each question should feel like a natural continuation of the conversation
- Reference their resume/cover letter when relevant
`}`;

      const apiMessages = messages.map((m: Message) => ({
        role: m.role,
        content: m.content,
      }));

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: isLastQuestion ? 1200 : 400,
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
