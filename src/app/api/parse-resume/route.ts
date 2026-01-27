import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = "";

    if (fileName.endsWith(".txt")) {
      // Plain text
      text = buffer.toString("utf-8");
    } else if (fileName.endsWith(".pdf")) {
      // PDF parsing with pdf-parse
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const result = await pdfParse(buffer);
        text = result.text || "";
      } catch (pdfError) {
        console.error("PDF parse error:", pdfError);
        return NextResponse.json(
          { error: "Could not parse PDF. Please copy the text and paste it instead." },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".docx")) {
      // DOCX parsing with mammoth
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || "";
      } catch (docxError) {
        console.error("DOCX parse error:", docxError);
        return NextResponse.json(
          { error: "Could not parse DOCX. Please copy the text and paste it instead." },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Old .doc format not supported. Please save as .docx or paste the text instead." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please use PDF, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please paste your resume instead." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json(
      { error: "Failed to parse file. Please paste your resume instead." },
      { status: 500 }
    );
  }
}
