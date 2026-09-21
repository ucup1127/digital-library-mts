// app/api/peminjaman-fisik/check-overdue/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/admin-log";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Cari peminjaman yang sudah lewat tanggal kembali & masih DIPINJAM
    const overdueLoans = await db.peminjamanFisik.findMany({
      where: {
        status: "DIPINJAM",
        tglKembali: {
          lt: today,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            className: true,
          },
        },
        bukuFisik: {
          select: {
            id: true,
            judul: true,
            penulis: true,
          },
        },
      },
    });
    
    // Catat ke AdminLog untuk notifikasi
    for (const loan of overdueLoans) {
      await logAdminActivity({
        action: "OVERDUE",
        targetType: "PEMINJAMAN",
        targetId: loan.id,
        targetName: `${loan.bukuFisik.judul} - ${loan.user.name}`,
        changes: {
          tglKembali: loan.tglKembali,
          terlambat: Math.ceil((today.getTime() - new Date(loan.tglKembali).getTime()) / (1000 * 3600 * 24)),
        },
      });
      
      // Update status jadi TERLAMBAT
      await db.peminjamanFisik.update({
        where: { id: loan.id },
        data: { status: "TERLAMBAT" },
      });
    }
    
    return NextResponse.json({
      message: "Overdue check completed",
      overdueCount: overdueLoans.length,
      overdueLoans,
    });
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error("Error checking overdue:", error);
      return NextResponse.json({ error: "Gagal mengecek overdue" }, { status: 500 });
    }
  }