import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function POST(req: Request) {
  const { token } = await req.json();
  try {
    const user = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    if (typeof user !== 'object' || !('email' in user) || !('id' in user)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    // Buat session JWT baru untuk NextAuth
    const sessionToken = jwt.sign(
      { id: (user as JwtPayload).id, email: (user as JwtPayload).email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '1h' }
    );
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60,
    });
    return response;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 