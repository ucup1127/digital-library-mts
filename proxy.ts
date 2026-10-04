// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🔥 Route yang BUTUH login (redirect ke /login/user)
const PROTECTED_ROUTES = ["/baca", "/tentang", "/galeri", "/profil-sekolah"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files & API
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session_token")?.value;
  const isMaintenance = request.cookies.get("maintenance_mode")?.value === "true";

  const isMaintenancePage = pathname === "/maintenance";
  const isLoginAdmin = pathname.startsWith("/login/admin");
  const isLoginUser = pathname.startsWith("/login/user");
  const isAdminRoute = pathname.startsWith("/admin");

  // ============================================
  // MAINTENANCE MODE
  // ============================================
  if (isMaintenance) {
    if (!isMaintenancePage && !isLoginAdmin && !isAdminRoute) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // ============================================
  // PROTEKSI ROUTE ADMIN
  // ============================================
  if (isAdminRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/login/admin", request.url));
  }

  // ============================================
  // 🔥 PROTEKSI ROUTE BUTUH LOGIN (siswa)
  // ============================================
  const needsAuth = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (needsAuth && !sessionToken) {
    return NextResponse.redirect(new URL("/login/user", request.url));
  }

  // ============================================
  // JIKA SUDAH LOGIN, JANGAN AKSES LOGIN PAGE
  // ============================================
  if ((isLoginAdmin || isLoginUser) && sessionToken) {
    // Kalau admin login → /admin, kalau user → /
    // ⚠️ Kita nggak bisa cek role di middleware, jadi redirect ke / aja
    // Nanti user bisa di-redirect dari sana
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};