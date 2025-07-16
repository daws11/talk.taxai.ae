import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionToken = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');

  // Token login logic (from src/middleware.ts)
  if (token) {
    // Call the token-login endpoint to handle automatic login
    const loginRes = await fetch(`${url.origin}/api/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });
    if (loginRes.ok) {
      // Redirect to the same path without the token query
      const cleanUrl = new URL(url.pathname, req.url);
      return NextResponse.redirect(cleanUrl);
    } else {
      // Token invalid/expired, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Jika di production dan user belum login, redirect ke dashboard eksternal
  if (isProduction && !sessionToken && !url.pathname.startsWith('/api')) {
    // Kecualikan halaman login dan register agar tidak loop
    if (!url.pathname.startsWith('/login') && !url.pathname.startsWith('/register')) {
      return NextResponse.redirect('https://dashboard.taxai.ae/');
    }
  }

  // Jika development, biarkan login page tampil seperti biasa
  return NextResponse.next();
};

export default withAuth(handler, {
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api/auth (auth API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - login
    // - register
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}; 