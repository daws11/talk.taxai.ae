import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: "Invalid transcript" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes conversations. Provide a concise summary of the key points discussed.",
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const summary = completion.choices[0]?.message?.content || "No summary generated";
      return NextResponse.json({ summary });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in summarize endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 