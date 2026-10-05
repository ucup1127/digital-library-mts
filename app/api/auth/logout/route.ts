// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, clearSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    // 🔥 Ambil data session dulu (sebelum dihapus)
    let userId: string | null = null;
    let schoolId: string | null = null;

    if (token) {
      const session = await db.session.findUnique({
        where: { token },
        select: { userId: true, user: { select: { schoolId: true } } },
      });

      if (session) {
        userId = session.userId;
        schoolId = session.user.schoolId;
      }

      await destroySession(token);
    }

    // 🔥 Log user activity — logout
    if (userId) {
      try {
        const ipAddress =
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          request.headers.get("x-real-ip") ||
          null;

        await db.userActivityLog.create({
          data: {
            userId,
            schoolId,
            action: "LOGOUT",
            description: "Logout dari sistem",
            ipAddress,
            userAgent: request.headers.get("user-agent") || null,
          },
        });
      } catch (logError) {
        logger.error("Failed to log logout:", logError);
      }
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