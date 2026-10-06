import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

/**
 * Uses any OpenAI-compatible LLM endpoint configured via env
 * (LLM_BASE_URL + LLM_API_KEY, model from LLM_MODEL).
 */
export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: "Invalid transcript" },
        { status: 400 }
      );
    }

    const baseURL = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    if (!baseURL || !apiKey) {
      return NextResponse.json(
        { error: "LLM is not configured: set LLM_BASE_URL and LLM_API_KEY" },
        { status: 500 }
      );
    }

    const llm = new OpenAI({ baseURL, apiKey });

    try {
      // glm reasoning models spend max_tokens on reasoning_content, which can
      // leave `content` empty; disable thinking for a short summary.
      // Ignored by providers that don't support the parameter.
      const body: Record<string, unknown> = {
        model: process.env.LLM_MODEL || "glm-5.3-flash",
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
        max_tokens: 600,
        temperature: 0.7,
      };
      if (process.env.LLM_THINKING !== "enabled") {
        body.thinking = { type: "disabled" };
      }

      const completion = (await llm.chat.completions.create(
        body as unknown as Parameters<typeof llm.chat.completions.create>[0]
      )) as { choices?: Array<{ message?: { content?: string | null } }> };

      const summary = completion.choices?.[0]?.message?.content?.trim() || "No summary generated";
      return NextResponse.json({ summary });
    } catch (llmError) {
      console.error("LLM API error:", llmError);
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
