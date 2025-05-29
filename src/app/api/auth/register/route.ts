import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase as connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { name, email, password, jobTitle } = await req.json();

    if (!name || !email || !password || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      jobTitle,
    });

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 