// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil session token dari cookie httpOnly
  const sessionToken = request.cookies.get('session_token')?.value;

  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLoginAdmin = pathname === '/login/admin';
  const isLoginUser = pathname === '/login/user';

  // =============================================
  // PROTEKSI ROUTE ADMIN
  // =============================================
  if (isAdminRoute) {
    if (!sessionToken) {
      console.log(`⛔ Redirect admin: ${pathname} → /login/admin`);
      return NextResponse.redirect(new URL('/login/admin', request.url));
    }
    // Validasi token dilakukan di API route / server component
    // (middleware nggak bisa akses DB karena Edge Runtime)
  }

  // =============================================
  // JIKA SUDAH LOGIN, JANGAN AKSES LOGIN PAGE
  // =============================================
  if ((isLoginAdmin || isLoginUser) && sessionToken) {
    // Redirect ke /admin — biar server component yang validasi
    // Kalau ternyata bukan admin, bakal di-redirect balik
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/login/:path*',
  ],
};