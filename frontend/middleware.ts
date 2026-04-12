import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define routes that require authentication
  const protectedRoutes = ['/dashboard', '/mentor', '/admin'];
  
  // Define auth routes (users don't need to visit these if already logged in)
  const authRoutes = ['/login', '/register', '/forgot-password'];
  
  const hasRefreshToken = request.cookies.has('refreshToken');
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If user accesses protected route without token, redirect to login
  if (isProtectedRoute && !hasRefreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user tries to access auth routes while logged in, redirect to dashboard
  if (isAuthRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
