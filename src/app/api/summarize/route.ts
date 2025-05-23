import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const transcript = body.transcript?.trim() || "";

    if (!transcript) {
      return NextResponse.json({ 
        summary: "No transcript available to summarize" 
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes tax-related conversations. Create a concise summary highlighting the key points, tax-related questions, and any important advice given. Focus on actionable insights and tax implications."
          },
          {
            role: "user",
            content: `Please summarize this tax-related conversation:\n\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const summary = completion.choices[0]?.message?.content?.trim() || "No summary generated";
      return NextResponse.json({ summary });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json({ 
        summary: "Failed to generate summary due to AI service error. Please try again later." 
      });
    }
  } catch (error) {
    console.error("Error in summarize endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process summary request", details: errorMessage },
      { status: 500 }
    );
  }
} 