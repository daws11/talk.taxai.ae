import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { language } = await req.json();
    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { language },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, language: user.language });
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
  }
} 