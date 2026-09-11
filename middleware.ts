// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 🔥 Ambil cookie
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
  const userRole = request.cookies.get('user_role')?.value || '';
  
  // 🔥 Cek apakah ini route admin
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  
  // 🔥 Cek apakah ini halaman login
  const isLoginAdmin = pathname === '/login/admin';
  const isLoginUser = pathname === '/login/user';
  
  // 🔥 Cek apakah ini halaman utama
  const isHomePage = pathname === '/';
  
  // =============================================
  // 🔥 PROTEKSI ROUTE ADMIN
  // =============================================
  if (isAdminRoute) {
    // Jika belum login atau bukan admin, redirect ke login admin
    if (!isLoggedIn || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      console.log(`⛔ Redirect admin: ${pathname} → /login/admin`);
      return NextResponse.redirect(new URL('/login/admin', request.url));
    }
  }
  
  // =============================================
  // 🔥 CEK SUDAH LOGIN TAPI AKSES LOGIN PAGE
  // =============================================
  if (isLoginAdmin && isLoggedIn) {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      console.log(`✅ Redirect: ${pathname} → /admin`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // 🔥 Jika user biasa akses login admin, redirect ke login user
    if (userRole === 'USER') {
      console.log(`✅ Redirect: ${pathname} → /login/user`);
      return NextResponse.redirect(new URL('/login/user', request.url));
    }
  }
  
  if (isLoginUser && isLoggedIn) {
    // 🔥 Jika user biasa akses login user, redirect ke home
    if (userRole === 'USER') {
      console.log(`✅ Redirect: ${pathname} → /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    // 🔥 Jika admin akses login user, redirect ke admin
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      console.log(`✅ Redirect: ${pathname} → /admin`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
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