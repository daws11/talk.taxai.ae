import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";

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

    // Ambil user dari database
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cek subscription dan callSeconds
    const subscription = user.subscription;
    if (!subscription || typeof subscription.callSeconds !== 'number') {
      // Tetap izinkan simpan conversation meski tidak ada quota
      // Tapi tandai quotaExceeded di response
      const conversationData = {
        userId: session.user.id,
        transcript: transcript.trim(),
        summary: summary?.trim() || "No summary available",
        duration: typeof duration === 'number' ? duration : 0,
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
          quotaExceeded: true,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          { error: "Failed to save conversation to database" },
          { status: 500 }
        );
      }
    }

    // Durasi percakapan (default 0 jika tidak ada)
    const conversationDuration = typeof duration === 'number' ? duration : 0;
    if (subscription.callSeconds <= 0) {
      // Tetap izinkan simpan conversation meski quota habis
      const conversationData = {
        userId: session.user.id,
        transcript: transcript.trim(),
        summary: summary?.trim() || "No summary available",
        duration: conversationDuration,
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
          quotaExceeded: true,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          { error: "Failed to save conversation to database" },
          { status: 500 }
        );
      }
    }
    if (subscription.callSeconds < 10) {
      return NextResponse.json({ error: "Your call quota is too low to start a conversation (minimum 10 seconds required)." }, { status: 403 });
    }
    if (conversationDuration <= 0) {
      return NextResponse.json({ error: "Conversation duration must be greater than 0" }, { status: 400 });
    }
    if (subscription.callSeconds < conversationDuration) {
      return NextResponse.json({ error: "Insufficient callSeconds quota" }, { status: 403 });
    }

    // Kurangi callSeconds dan update user
    // Dihapus: subscription.callSeconds -= conversationDuration;
    // Dihapus: await user.updateOne({ subscription });

    // Create conversation with all fields
    const conversationData = {
      userId: session.user.id,
      transcript: transcript.trim(),
      summary: summary?.trim() || "No summary available",
      duration: conversationDuration,
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