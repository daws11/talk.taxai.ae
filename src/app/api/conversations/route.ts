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

    const { transcript, summary, duration, status } = body;

    if (!transcript || typeof transcript !== 'string') {
      console.error("Invalid transcript:", transcript);
      return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });
    }

    if (!transcript.trim()) {
      console.error("Empty transcript");
      return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
    }

    const conversationData = {
      userId: session.user.id,
      transcript,
      summary,
      duration,
      status,
      createdAt: new Date(),
    };

    const conversation = await Conversation.create(conversationData);

    const response = {
      id: conversation._id,
      transcript: conversation.transcript,
      summary: conversation.summary,
      duration: conversation.duration,
      status: conversation.status,
      createdAt: conversation.createdAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
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
      .select('transcript summary duration status createdAt');

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
} 