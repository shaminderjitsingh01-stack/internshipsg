import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Dynamic import for pdf-parse
async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse ESM doesn't have default export, use named import pattern
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = (pdfParseModule as any).default || pdfParseModule;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let text = "";

    // Extract text based on file type
    if (fileName.endsWith(".txt")) {
      text = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        text = await parsePdf(buffer);
      } catch (pdfError) {
        return NextResponse.json(
          { error: "Could not parse PDF file. Please try pasting the text directly." },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      // For DOC/DOCX, we'll try to extract basic text
      // In production, you'd want to use a proper library like mammoth
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      text = decoder.decode(buffer);
      // Clean up binary content
      text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT" },
        { status: 400 }
      );
    }

    if (text.length < 100) {
      return NextResponse.json(
        { error: "Could not extract enough text from the document. Please try pasting the text directly." },
        { status: 400 }
      );
    }

    // Use Claude to extract and structure the job description
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract and structure this job description from a document. Return ONLY valid JSON (no markdown, no explanation):

Document Text:
${text.slice(0, 10000)}

Return this exact JSON format:
{
  "title": "Job Title (extract from text or infer)",
  "company": "Company Name (extract from text or use 'Not specified')",
  "description": "The full job description text, cleaned up",
  "requirements": {
    "nonNegotiable": ["requirement 1", "requirement 2"],
    "goodToHave": ["nice to have 1", "nice to have 2"]
  }
}

For requirements classification:
- nonNegotiable: Required qualifications, must-have skills, mandatory experience, educational requirements
- goodToHave: Preferred qualifications, bonus skills, nice-to-have experience

Extract ALL requirements mentioned. Be thorough.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let jobDescription;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobDescription = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: "Could not parse job description structure" },
        { status: 400 }
      );
    }

    return NextResponse.json({ jobDescription });
  } catch (error: any) {
    console.error("Error parsing job document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
