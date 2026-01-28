import { NextRequest, NextResponse } from "next/server";
import {
  interviewQuestions,
  QuestionCategory,
  QuestionDifficulty,
  Industry,
  InterviewQuestion
} from "@/data/interviewQuestions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get filter parameters
  const category = searchParams.get("category") as QuestionCategory | null;
  const difficulty = searchParams.get("difficulty") as QuestionDifficulty | null;
  const industry = searchParams.get("industry") as Industry | null;
  const company = searchParams.get("company");
  const search = searchParams.get("search")?.toLowerCase();
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const random = searchParams.get("random") === "true";

  try {
    let filteredQuestions: InterviewQuestion[] = [...interviewQuestions];

    // Apply filters
    if (category && category !== ("All" as string)) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }

    if (difficulty && difficulty !== ("All" as string)) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    if (industry && industry !== ("All" as string)) {
      filteredQuestions = filteredQuestions.filter(q => q.industry === industry);
    }

    if (company) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.company?.toLowerCase().includes(company.toLowerCase())
      );
    }

    if (search) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.question.toLowerCase().includes(search) ||
        q.tips.some(tip => tip.toLowerCase().includes(search))
      );
    }

    // Get total before pagination
    const total = filteredQuestions.length;

    // Randomize if requested
    if (random) {
      filteredQuestions = filteredQuestions.sort(() => 0.5 - Math.random());
    }

    // Apply pagination
    const paginatedQuestions = filteredQuestions.slice(offset, offset + limit);

    // Get filter options (for UI dropdowns)
    const filterOptions = {
      categories: ["All", "Behavioral", "Technical", "Case Study", "Situational"] as const,
      difficulties: ["All", "Easy", "Medium", "Hard"] as const,
      industries: ["All", "General", "Technology", "Finance", "Consulting", "Marketing", "Healthcare", "Engineering", "Startup"] as const,
      companies: [...new Set(interviewQuestions.filter(q => q.company).map(q => q.company))]
    };

    return NextResponse.json({
      questions: paginatedQuestions,
      total,
      filterOptions,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
