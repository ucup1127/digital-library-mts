// app/api/cron/check-due-date/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

// Verifikasi cron secret
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === env.CRON_SECRET;
}

export async function GET(request: Request) {
  try {
    // Verifikasi cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.log("🕐 Running cron: check-due-date");

    // Tanggal hari ini (mulai 00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cari peminjaman yang jatuh tempo HARI INI
    const dueToday = await db.peminjamanFisik.findMany({
      where: {
        status: "DIPINJAM",
        tglDikembalikan: null,
        tglKembali: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        bukuFisik: { select: { judul: true } },
      },
    });

    // Cari peminjaman yang TERLAMBAT (belum dikembalikan & lewat jatuh tempo)
    const overdue = await db.peminjamanFisik.findMany({
      where: {
        status: { in: ["DIPINJAM", "TERLAMBAT"] },
        tglDikembalikan: null,
        tglKembali: { lt: today },
      },
      include: {
        user: { select: { id: true, name: true } },
        bukuFisik: { select: { judul: true } },
      },
    });

    const notifications: any[] = [];

    // Notif DUE_TODAY
    for (const p of dueToday) {
      // Cek apakah udah ada notif DUE_TODAY hari ini
      const existing = await db.notification.findFirst({
        where: {
          userId: p.userId,
          type: "DUE_TODAY",
          createdAt: { gte: today },
        },
      });

      if (!existing) {
        notifications.push({
          userId: p.userId,
          title: "Pengingat: Jatuh Tempo Hari Ini",
          message: `Buku "${p.bukuFisik.judul}" harus dikembalikan hari ini.`,
          type: "DUE_TODAY",
          link: "/akun",
        });
      }
    }

    // Notif OVERDUE + update status
    for (const p of overdue) {
      // Update status ke TERLAMBAT
      if (p.status !== "TERLAMBAT") {
        await db.peminjamanFisik.update({
          where: { id: p.id },
          data: { status: "TERLAMBAT" },
        });
      }

      // Hitung denda
      const tglKembali = new Date(p.tglKembali);
      tglKembali.setHours(0, 0, 0, 0);
      const hariTerlambat = Math.ceil(
        (today.getTime() - tglKembali.getTime()) / (1000 * 3600 * 24)
      );
      const denda = hariTerlambat * 1000;

      await db.peminjamanFisik.update({
        where: { id: p.id },
        data: { denda },
      });

      // Cek udah ada notif overdue hari ini
      const existing = await db.notification.findFirst({
        where: {
          userId: p.userId,
          type: "OVERDUE",
          createdAt: { gte: today },
        },
      });

      if (!existing) {
        notifications.push({
          userId: p.userId,
          title: "Buku Terlambat Dikembalikan",
          message: `Buku "${p.bukuFisik.judul}" terlambat ${hariTerlambat} hari. Denda: Rp ${denda.toLocaleString("id-ID")}`,
          type: "OVERDUE",
          link: "/akun",
        });
      }
    }

    // Batch create notif
    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    logger.log(`✅ Cron done: ${dueToday.length} due today, ${overdue.length} overdue`);

    return NextResponse.json({
      success: true,
      dueToday: dueToday.length,
      overdue: overdue.length,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    logger.error("Cron error:", error);
    return NextResponse.json({ error: "Cron gagal" }, { status: 500 });
  }
}