import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/models/Conversation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("Unauthorized: No user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { transcript, summary, duration, status, startTime, endTime } = body;

    // Basic validation
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });
    }

    if (!transcript.trim()) {
      return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
    }

    // Create conversation with all fields
    const conversationData = {
      userId: session.user.id,
      transcript: transcript.trim(),
      summary: summary?.trim() || "No summary available",
      duration: duration || 0,
      status: status || "completed",
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
    };

    try {
      const conversation = await Conversation.create(conversationData);
      
      if (!conversation || !conversation._id) {
        throw new Error("Failed to create conversation");
      }

      return NextResponse.json({
        _id: conversation._id,
        transcript: conversation.transcript,
        summary: conversation.summary,
        duration: conversation.duration,
        status: conversation.status,
        startTime: conversation.startTime,
        endTime: conversation.endTime,
        createdAt: conversation.createdAt,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save conversation to database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("Unauthorized: No user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const conversations = await Conversation.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .select('_id transcript summary duration status startTime endTime createdAt');

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
} 