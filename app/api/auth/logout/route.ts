// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, clearSessionCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      await destroySession(token);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Logout error:", error);
    return NextResponse.json(
      { error: "Gagal logout" },
      { status: 500 }
    );
  }
}