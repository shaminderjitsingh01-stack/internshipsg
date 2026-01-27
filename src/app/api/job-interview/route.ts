import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, resume, coverLetter, action, transcript } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Generate interview questions based on job description
    if (action === "generate-questions") {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `You are an expert interviewer. Generate interview questions for this specific job role.

JOB TITLE: ${jobDescription.title}
COMPANY: ${jobDescription.company}

JOB DESCRIPTION:
${jobDescription.description}

NON-NEGOTIABLE REQUIREMENTS:
${jobDescription.requirements?.nonNegotiable?.join("\n- ") || "None specified"}

GOOD TO HAVE:
${jobDescription.requirements?.goodToHave?.join("\n- ") || "None specified"}

${resume ? `CANDIDATE'S RESUME:\n${resume}\n` : ""}
${coverLetter ? `CANDIDATE'S COVER LETTER:\n${coverLetter}\n` : ""}
Generate 8-10 targeted interview questions that:
1. Assess the non-negotiable requirements (2-3 questions)
2. Explore the good-to-have skills (1-2 questions)
3. Evaluate behavioral competencies relevant to this role (2-3 questions)
4. Test problem-solving and situational judgment (2 questions)
5. Assess cultural fit and motivation for this specific role (1-2 questions)

For each question, also specify which requirement or competency it's assessing.

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "The interview question",
      "category": "technical|behavioral|situational|cultural_fit",
      "assessing": "What requirement or skill this assesses",
      "followUp": "A potential follow-up question"
    }
  ],
  "openingMessage": "A brief, professional greeting introducing the interview for this specific role"
}`,
          },
        ],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    // Analyze the interview transcript against job requirements
    if (action === "analyze") {
      if (!transcript) {
        return NextResponse.json({ error: "Transcript is required for analysis" }, { status: 400 });
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are an expert interview assessor. Analyze this interview transcript against the job requirements.

JOB TITLE: ${jobDescription.title}
COMPANY: ${jobDescription.company}

JOB DESCRIPTION:
${jobDescription.description}

NON-NEGOTIABLE REQUIREMENTS:
${jobDescription.requirements?.nonNegotiable?.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") || "None specified"}

GOOD TO HAVE REQUIREMENTS:
${jobDescription.requirements?.goodToHave?.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n") || "None specified"}

${resume ? `CANDIDATE'S RESUME:\n${resume}\n` : ""}
${coverLetter ? `CANDIDATE'S COVER LETTER:\n${coverLetter}\n` : ""}
INTERVIEW TRANSCRIPT:
${transcript}

Provide a comprehensive analysis. Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "overallFeedback": "2-3 sentence overall assessment",

  "dimensionalAnalysis": {
    "communicationSkills": {
      "score": 0-100,
      "videoInsights": "What the interview revealed about communication",
      "cvGap": "What wasn't evident from CV alone",
      "examples": ["specific quote or behavior from transcript"]
    },
    "problemSolving": {
      "score": 0-100,
      "videoInsights": "Problem-solving approach shown in interview",
      "cvGap": "What CV doesn't show about their approach",
      "examples": ["specific examples from transcript"]
    },
    "adaptabilityLearning": {
      "score": 0-100,
      "videoInsights": "Evidence of adaptability and learning mindset",
      "cvGap": "What CV doesn't reveal",
      "examples": ["specific examples"]
    },
    "passionMotivation": {
      "score": 0-100,
      "videoInsights": "Passion and motivation demonstrated",
      "cvGap": "What CV doesn't convey",
      "examples": ["specific examples"]
    },
    "handlingFailures": {
      "score": 0-100,
      "videoInsights": "How they discussed setbacks or challenges",
      "cvGap": "CV typically doesn't show this",
      "examples": ["specific examples"]
    },
    "culturalFit": {
      "score": 0-100,
      "videoInsights": "Cultural fit indicators from interview",
      "cvGap": "What CV doesn't indicate",
      "examples": ["specific examples"]
    }
  },

  "requirementMatchAnalysis": {
    "summary": {
      "matched": 0,
      "partiallyMatched": 0,
      "inferred": 0,
      "notMatched": 0,
      "notAddressed": 0
    },
    "nonNegotiable": [
      {
        "requirement": "The requirement text",
        "status": "matched|partially_matched|inferred|not_matched|not_addressed",
        "upgradeDowngrade": "upgraded|downgraded|none",
        "analysis": "Detailed analysis of how candidate met or didn't meet this",
        "evidence": "Specific quote or reference from transcript"
      }
    ],
    "goodToHave": [
      {
        "requirement": "The requirement text",
        "status": "matched|partially_matched|inferred|not_matched|not_addressed",
        "upgradeDowngrade": "upgraded|downgraded|none",
        "analysis": "Detailed analysis",
        "evidence": "Specific evidence from transcript"
      }
    ]
  },

  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "hiringRecommendation": "strong_yes|yes|maybe|no|strong_no",
  "recommendationReason": "Brief explanation of hiring recommendation"
}`,
          },
        ],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json({ analysis: JSON.parse(jsonMatch[0]) });
      }
      return NextResponse.json({ error: "Failed to analyze interview" }, { status: 500 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in job interview API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
