import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import jwt from 'jsonwebtoken';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

const customMiddleware = async (req: NextRequest) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (token) {
    try {
      const user = jwt.verify(token, NEXTAUTH_SECRET!);
      // Set session cookie for NextAuth (jwt strategy)
      // NextAuth expects a session token in a cookie named 'next-auth.session-token' (for production) or '__Secure-next-auth.session-token' (for HTTPS)
      // We'll use the production cookie name for simplicity
      const response = NextResponse.redirect(new URL(url.pathname, req.url));
      response.cookies.set('next-auth.session-token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      return response;
    } catch (e) {
      // Token invalid/expired, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  // If no token, let withAuth handle the request
  return NextResponse.next();
};

export default withAuth(customMiddleware, {
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - register
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}; 