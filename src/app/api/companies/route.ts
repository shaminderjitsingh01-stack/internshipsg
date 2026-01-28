import { NextResponse } from "next/server";
import { getAllCompanies, getCompaniesByIndustry } from "@/data/companies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");

    let companies;

    if (industry) {
      companies = getCompaniesByIndustry(industry);
    } else {
      companies = getAllCompanies();
    }

    // Return summary data for listing (exclude detailed questions for performance)
    const companySummaries = companies.map((company) => ({
      slug: company.slug,
      name: company.name,
      industry: company.industry,
      description: company.description,
      headquarters: company.headquarters,
      employeeCount: company.employeeCount,
      interviewSteps: company.interviewProcess.length,
      questionCount: company.commonQuestions.length,
      culture: company.culture,
    }));

    return NextResponse.json({
      success: true,
      count: companySummaries.length,
      companies: companySummaries,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
