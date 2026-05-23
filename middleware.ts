// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Halaman yang tetap bisa diakses saat maintenance
const allowedPaths = [
  '/login/admin',
  '/login/user',
  '/api/login',
  '/api/settings',
  '/maintenance',
  '/api/system-log', // Izinkan system log API
];

// Fungsi untuk mencatat error ke system log (tanpa import karena middleware tidak bisa akses db langsung)
async function logToSystemLog(level: string, message: string, context?: any) {
  try {
    // Panggil API internal untuk mencatat log
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/system-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        path: context?.path,
        method: context?.method,
        userAgent: context?.userAgent,
        ipAddress: context?.ip,
      }),
    }).catch(() => {});
  } catch (error) {
    // Silent fail, jangan ganggu request utama
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  
  // Tambahkan header untuk tracking
  const response = NextResponse.next();
  response.headers.set('X-Request-Path', pathname);
  response.headers.set('X-Request-Method', request.method);
  
  // 🔥 Catat request yang lambat (> 2 detik)
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Schedule logging untuk request lambat (setelah response dikirim)
  if (process.env.NODE_ENV === 'production') {
    setTimeout(async () => {
      const duration = Date.now() - startTime;
      if (duration > 2000) {
        await logToSystemLog('WARNING', `Slow request: ${duration}ms`, {
          path: pathname,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.ip,
        });
      }
    }, 0);
  }
  
  // Cek maintenance mode via cookie (set dari API)
  const isMaintenance = request.cookies.get('maintenance_mode')?.value === 'true';
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
  
  if (isMaintenance && !allowedPaths.some(path => pathname.startsWith(path))) {
    // Jika admin sudah login, izinkan akses ke halaman admin
    if (isLoggedIn && (pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))) {
      return response;
    }
    // Redirect ke halaman maintenance
    const url = new URL('/maintenance', request.url);
    return NextResponse.redirect(url);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};