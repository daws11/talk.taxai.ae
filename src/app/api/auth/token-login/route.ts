import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { encode } from 'next-auth/jwt';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function POST(req: Request) {
  const { token } = await req.json();
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    if (typeof payload !== 'object' || !('email' in payload)) {
      console.log('Invalid token payload:', payload);
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    const email = (payload as JwtPayload).email as string;
    // Cari user di database
    await connectToDatabase();
    const user = await User.findOne({ email });
    console.log('SSO login attempt for email:', email, 'User found:', !!user);
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    // Buat session token NextAuth yang valid (menggunakan encode dari next-auth/jwt)
    const sessionPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      language: user.language,
    };
    const sessionToken = await encode({
      token: sessionPayload,
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60 * 24, // 1 hari
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    });
    return response;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 