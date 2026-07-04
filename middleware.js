import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'campus-connect-secret-key-change-in-production' });
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  const publicPaths = ['/', '/api/auth', '/api/test-group-put', '/api/fix-db', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // Not logged in → redirect to login (except public paths)
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Logged in → redirect away from login page to correct dashboard
  if (token && pathname === '/') {
    const dashboardMap = {
      admin: '/admin/dashboard',
      faculty: '/faculty/dashboard',
      student: '/student/dashboard',
    };
    const dashboard = dashboardMap[token.role] || '/';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Role-based route protection
  if (token) {
    const role = token.role;

    // Student trying to access faculty or admin routes
    if (role === 'student' && (pathname.startsWith('/faculty') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }

    // Faculty trying to access admin or student routes
    if (role === 'faculty' && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
      return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
    }

    // Admin trying to access faculty or student routes
    if (role === 'admin' && (pathname.startsWith('/faculty') || pathname.startsWith('/student'))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
