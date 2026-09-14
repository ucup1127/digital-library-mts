// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  const isMaintenance =
    request.cookies.get("maintenance_mode")?.value === "true";

  // Route yang DIPERBOLEHKAN saat maintenance ON
  const isMaintenancePage = pathname === "/maintenance";
  const isLoginAdmin = pathname.startsWith("/login/admin");
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginUser = pathname.startsWith("/login/user");

  // ============================================
  // MAINTENANCE MODE
  // ============================================
  if (isMaintenance) {
    // Kalau BUKAN halaman yang dikecualikan → redirect ke /maintenance
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
  // JIKA SUDAH LOGIN, JANGAN AKSES LOGIN PAGE
  // ============================================
  if ((isLoginAdmin || isLoginUser) && sessionToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};