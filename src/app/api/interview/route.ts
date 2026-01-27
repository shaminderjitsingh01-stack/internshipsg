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
    const {
      messages,
      userProfile,
      action,
      resumeText,
      coverLetterText,
      interviewDuration = 15,
      elapsedMinutes = 0,
      remainingMinutes = 15,
      isTimeUp = false
    } = await request.json();

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

    const questionCount = messages?.filter((m: Message) => m.role === "assistant").length || 0;

    // Determine question category based on time and question number
    // Rotate through: Communication -> Technical -> Soft Skills
    const getQuestionCategory = (qNum: number, elapsed: number, duration: number) => {
      const progress = elapsed / duration; // 0 to 1

      if (qNum === 1) return "ice-breaker";
      if (qNum === 2) return "background";

      // Rotate through categories
      const categories = [
        { name: "communication", focus: "Clear articulation, confidence, storytelling ability" },
        { name: "technical", focus: "Industry knowledge, problem-solving, analytical thinking" },
        { name: "soft-skills", focus: "Teamwork, leadership, adaptability, emotional intelligence" },
      ];

      const categoryIndex = (qNum - 3) % 3;
      return categories[categoryIndex];
    };

    const currentCategory = getQuestionCategory(questionCount + 1, elapsedMinutes, interviewDuration);

    // Start new interview
    if (action === "start") {
      const systemPrompt = `You are a warm, professional AI interview coach helping a Singapore internship candidate practice and improve their interview skills.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Target Role/Industry: ${userProfile?.targetRole || "Internship"}
- Experience Level: ${userProfile?.experience || "Student"}
${candidateContext}

INTERVIEW SESSION: ${interviewDuration} minutes
Focus Areas: Communication Skills, Technical Knowledge, Soft Skills

YOUR TASK FOR THIS FIRST TURN:
Give a warm, encouraging welcome to ${userProfile?.name || "the candidate"}. Let them know this is a safe space to practice. Mention this is a ${interviewDuration}-minute session. Then ask a simple ice-breaker question to help them relax.

COACHING APPROACH:
- Your goal is to help them IMPROVE their interview skills
- Focus on building their confidence
- Ask questions that will help them practice articulating their experiences clearly
- After each answer, you'll provide brief coaching feedback along with the next question

RULES:
- Be warm, encouraging, and supportive
- Keep your welcome SHORT - just 2-3 sentences + ONE question
- Use their name to personalize
- Do NOT introduce yourself by name
- Make them feel this is a supportive practice session, not a test

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
      // Time's up - provide final feedback
      if (isTimeUp) {
        const feedbackPrompt = `You are a supportive AI interview coach. The ${interviewDuration}-minute practice session has ended.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Target Role/Industry: ${userProfile?.targetRole || "Internship"}
${candidateContext}

CONVERSATION SO FAR:
${messages?.map((m: Message) => `${m.role === "assistant" ? "Coach" : "Candidate"}: ${m.content}`).join("\n\n")}

Provide comprehensive, encouraging feedback:

1. OPENING: Congratulate them on completing the practice session!

2. OVERALL IMPRESSION (2-3 sentences): How they came across overall

3. COMMUNICATION SKILLS (Score /10):
   - Clarity of expression
   - Confidence level
   - Storytelling ability
   - Areas to improve

4. TECHNICAL KNOWLEDGE (Score /10):
   - Understanding of their field
   - Problem-solving approach
   - Areas to develop

5. SOFT SKILLS (Score /10):
   - Teamwork examples
   - Leadership potential
   - Adaptability shown

6. TOP 3 SPECIFIC TIPS for their ${userProfile?.targetRole || "internship"} interviews

7. CLOSING: End with encouragement and a confidence boost

Be warm, specific (reference their actual answers), and constructive. This is practice - help them improve!`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: feedbackPrompt,
          messages: [{ role: "user", content: "Please provide feedback on my interview practice." }],
        });

        const responseText = message.content[0].type === "text" ? message.content[0].text : "";

        return NextResponse.json({
          message: responseText,
          questionNumber: questionCount + 1,
          isComplete: true,
        });
      }

      // Build question type description
      let questionTypeDesc = "";
      if (typeof currentCategory === "string") {
        if (currentCategory === "ice-breaker") {
          questionTypeDesc = "ice-breaker question to build rapport";
        } else if (currentCategory === "background") {
          questionTypeDesc = "background question about their experience";
        }
      } else {
        questionTypeDesc = `${currentCategory.name.toUpperCase()} question - Focus: ${currentCategory.focus}`;
      }

      const systemPrompt = `You are a supportive AI interview coach helping a Singapore internship candidate improve their interview skills.

Candidate Profile:
- Name: ${userProfile?.name || "Candidate"}
- Target Role/Industry: ${userProfile?.targetRole || "Internship"}
- Experience Level: ${userProfile?.experience || "Student"}
${candidateContext}

SESSION INFO:
- Duration: ${interviewDuration} minutes
- Time elapsed: ${elapsedMinutes} minutes
- Time remaining: ${remainingMinutes} minutes
- Question #${questionCount + 1}

NEXT QUESTION TYPE: ${questionTypeDesc}

YOUR COACHING APPROACH:
1. First, give brief MICRO-FEEDBACK on their previous answer (1-2 sentences):
   - What they did well (be specific!)
   - One quick tip to improve (if applicable)

2. Then TRANSITION naturally to your next question

3. Ask your next question based on the type above:

   COMMUNICATION questions test:
   - "Walk me through..." (tests explanation clarity)
   - "How would you explain X to someone non-technical?"
   - "Tell me about a time you had to communicate a complex idea"

   TECHNICAL questions test:
   - Industry-specific knowledge for ${userProfile?.targetRole || "their field"}
   - Problem-solving scenarios
   - "How would you approach..." questions

   SOFT SKILLS questions test:
   - Teamwork: "Tell me about working in a team..."
   - Leadership: "Describe a time you took initiative..."
   - Adaptability: "How did you handle a sudden change..."
   - Conflict resolution: "Tell me about a disagreement..."

IMPORTANT - PERSONALIZE YOUR QUESTIONS:
- Reference specific items from their resume
- Connect to their cover letter goals
- Build on what they've shared in previous answers
- Make the conversation feel natural

CRITICAL RULES:
- Do NOT introduce yourself or repeat greetings
- Keep micro-feedback brief and encouraging
- ONE question only after your feedback
- Reference their actual answer in your feedback
- Match your question to the category type above`;

      const apiMessages = messages.map((m: Message) => ({
        role: m.role,
        content: m.content,
      }));

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: apiMessages,
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";

      return NextResponse.json({
        message: responseText,
        questionNumber: questionCount + 1,
        isComplete: false,
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
