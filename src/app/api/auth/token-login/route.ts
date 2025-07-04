import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { encode } from 'next-auth/jwt';

export async function POST(req: Request) {
  const { token } = await req.json();
  try {
    const user = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    if (typeof user !== 'object' || !('email' in user) || !('id' in user)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    const sessionPayload = {
      id: (user as JwtPayload).id,
      email: (user as JwtPayload).email,
    };
    const sessionToken = await encode({
      token: sessionPayload,
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60,
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60,
      // secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 