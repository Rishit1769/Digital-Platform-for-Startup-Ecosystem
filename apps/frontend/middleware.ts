import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const padded = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function roleHomePage(role?: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'mentor') return '/mentor';
  return '/dashboard';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define routes that require authentication
  const protectedRoutes = ['/dashboard', '/mentor', '/admin'];
  
  // Define auth routes (users don't need to visit these if already logged in)
  const authRoutes = ['/login', '/register', '/forgot-password'];
  
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const hasRefreshToken = !!refreshToken;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If user accesses protected route without token, redirect to login
  if (isProtectedRoute && !hasRefreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user tries to access auth routes while logged in, redirect to their role home page
  if (isAuthRoute && hasRefreshToken) {
    const payload = decodeJwtPayload(refreshToken!);
    const home = roleHomePage(payload?.role);
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
