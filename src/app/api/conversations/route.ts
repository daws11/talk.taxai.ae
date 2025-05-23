import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/models/Conversation";

export async function POST(request: Request) {
  try {
    console.log("Received conversation save request");
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("Unauthorized: No user session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.id);

    await connectToDatabase();
    console.log("Database connected");

    const body = await request.json();
    console.log("Request body:", body);
    
    const { transcript, summary, duration, startTime, endTime } = body;

    // Validate required fields
    if (!transcript || typeof transcript !== "string") {
      console.error("Invalid transcript:", transcript);
      return NextResponse.json(
        { error: "Transcript is required and must be a string" },
        { status: 400 }
      );
    }

    if (!transcript.trim()) {
      console.error("Empty transcript");
      return NextResponse.json(
        { error: "Transcript cannot be empty" },
        { status: 400 }
      );
    }

    // Create conversation data with validation
    const conversationData = {
      userId: session.user.id,
      transcript: transcript.trim(),
      summary: summary?.trim() || "No summary available",
      duration: typeof duration === "number" ? duration : 0,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
      status: "completed"
    };

    console.log("Creating conversation with data:", conversationData);

    // Create and save conversation
    const conversation = await Conversation.create(conversationData);
    console.log("Conversation saved:", conversation);

    // Return the saved conversation with all fields
    const response = {
      id: conversation._id,
      transcript: conversation.transcript,
      summary: conversation.summary,
      duration: conversation.duration,
      startTime: conversation.startTime,
      endTime: conversation.endTime,
      status: conversation.status
    };

    console.log("Sending response:", response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { 
        error: "Failed to save conversation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log("Received conversation fetch request");
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("Unauthorized: No user session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.id);

    await connectToDatabase();
    console.log("Database connected");

    const conversations = await Conversation.find({ userId: session.user.id })
      .sort({ startTime: -1 })
      .select("transcript summary duration startTime endTime status")
      .lean();

    console.log(`Found ${conversations.length} conversations`);
    return NextResponse.json(conversations);

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch conversations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 