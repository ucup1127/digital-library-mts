// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🔥 Route yang BUTUH login (redirect ke /login/user)
const PROTECTED_ROUTES = ["/baca"];

// 🔥 CSRF exempt — endpoint yang nggak butuh CSRF token
const CSRF_EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/register",
  "/api/public",
  "/api/track",
  "/api/visitor-log",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Ambil session token
  const sessionToken = request.cookies.get("session_token")?.value;

  // ============================================
  // 🔥 CSRF PROTECTION — WAJIB DI ATAS SKIP
  // ============================================
  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isApiRoute = pathname.startsWith("/api/");
  const isCsrfExempt = CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (isMutatingMethod && isApiRoute && !isCsrfExempt && sessionToken) {
    const csrfFromCookie = request.cookies.get("csrf_token")?.value;
    const csrfFromHeader =
      request.headers.get("X-CSRF-Token") ||
      request.headers.get("x-csrf-token");

    if (!csrfFromCookie || !csrfFromHeader || csrfFromCookie !== csrfFromHeader) {
      return NextResponse.json(
        { error: "CSRF token tidak valid. Refresh halaman dan coba lagi." },
        { status: 403 }
      );
    }
  }

  // ============================================
  // SKIP STATIC FILES
  // ============================================
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  // ============================================
  // VARIABEL LAIN
  // ============================================
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
  if (isAdminRoute || isLoginAdmin || isLoginUser) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    if (isAdminRoute && !sessionToken) {
      return NextResponse.redirect(new URL("/login/admin", request.url));
    }

    return response;
  }

  // ============================================
  // PROTEKSI ROUTE BUTUH LOGIN (siswa)
  // ============================================
  const needsAuth = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (needsAuth && !sessionToken) {
    return NextResponse.redirect(new URL("/login/user", request.url));
  }

  // ============================================
  // JIKA SUDAH LOGIN, JANGAN AKSES LOGIN PAGE
  // ============================================
  if ((isLoginAdmin || isLoginUser) && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};