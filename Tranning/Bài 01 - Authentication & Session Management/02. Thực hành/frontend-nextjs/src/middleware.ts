/**
 * =======================================================================
 * File: src/middleware.ts
 * Next.js Edge Middleware: Bảo vệ route ở tầng Edge trước khi vào Server Component
 * =======================================================================
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy HttpOnly Cookie 'refreshToken' từ Request Headers do trình duyệt gửi lên
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

  // 1. Nếu chưa có cookie phiên mà cố truy cập trang được bảo vệ -> Redirect về /login
  if (isProtectedRoute && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Nếu đã có cookie phiên mà vẫn vào trang /login -> Redirect thẳng vào /dashboard
  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login'],
};
