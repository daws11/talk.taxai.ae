import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { tickSeconds = 1 } = await req.json(); // default 1 detik per tick

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = user.subscription;
    if (!subscription || typeof subscription.callSeconds !== "number") {
      return NextResponse.json({ error: "No callSeconds quota available" }, { status: 403 });
    }

    if (subscription.callSeconds < tickSeconds) {
      subscription.callSeconds = 0;
      await user.updateOne({ subscription });
      return NextResponse.json({ error: "callSeconds quota exhausted", remaining: 0 }, { status: 403 });
    }

    subscription.callSeconds -= tickSeconds;
    await user.updateOne({ subscription });

    return NextResponse.json({ success: true, remaining: subscription.callSeconds });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 