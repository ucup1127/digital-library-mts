// app/api/cron/deactivate-graduated/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: cek CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error("CRON_SECRET tidak di-set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.log("🔄 Running auto-deactivate graduated students...");

    const result = await db.user.updateMany({
      where: {
        role: "USER",
        isActive: true,
        className: {
          startsWith: "9",
        },
      },
      data: {
        isActive: false,
        graduatedAt: new Date(),
      },
    });

    logger.log(`✅ ${result.count} user dinonaktifkan (kelas 9)`);

    return NextResponse.json({
      success: true,
      deactivated: result.count,
      message: `Berhasil menonaktifkan ${result.count} siswa lulus`,
    });
  } catch (error) {
    logger.error("Error deactivating graduated students:", error);
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}