// app/api/peminjaman-fisik/extend/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

const actionSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"], {
    message: "Action harus APPROVED atau REJECTED",
  }),
  note: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const parseResult = actionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { action, note } = parseResult.data;

    const peminjaman = await db.peminjamanFisik.findUnique({
      where: { id },
      include: {
        bukuFisik: { select: { judul: true } },
        user: { select: { id: true, name: true, username: true } },
      },
    });

    if (!peminjaman) {
      return NextResponse.json({ error: "Peminjaman tidak ditemukan" }, { status: 404 });
    }

    if (peminjaman.extensionStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Tidak ada pengajuan perpanjangan yang menunggu" },
        { status: 400 }
      );
    }

    if (action === "APPROVED") {
      // Tambah 7 hari dari tglKembali lama
      const newTglKembali = new Date(peminjaman.tglKembali);
      newTglKembali.setDate(newTglKembali.getDate() + 7);

      await db.peminjamanFisik.update({
        where: { id },
        data: {
          tglKembali: newTglKembali,
          extendedAt: new Date(),
          extendedCount: { increment: 1 },
          extensionStatus: "APPROVED",
          extensionNote: note || null,
          // Reset status kalau sebelumnya TERLAMBAT
          status: peminjaman.status === "TERLAMBAT" ? "DIPINJAM" : peminjaman.status,
        },
      });

      // Notif ke siswa
      await db.notification.create({
        data: {
          userId: peminjaman.userId,
          title: "Perpanjangan Disetujui",
          message: `Perpanjangan untuk buku "${peminjaman.bukuFisik.judul}" disetujui. Tanggal kembali baru: ${newTglKembali.toLocaleDateString("id-ID")}`,
          type: "EXTEND_APPROVED",
          link: "/akun",
        },
      });

      await logAdminActivityServer({
        action: "APPROVE_EXTEND",
        targetType: "PEMINJAMAN",
        targetId: peminjaman.id,
        targetName: `${peminjaman.bukuFisik.judul} - ${peminjaman.user.name || peminjaman.user.username}`,
        changes: { newTglKembali: newTglKembali.toISOString(), note },
      });

      revalidateTag("admin-stats", "max");

      return NextResponse.json({
        success: true,
        message: "Perpanjangan disetujui",
        newTglKembali,
      });
    } else {
      // REJECTED
      await db.peminjamanFisik.update({
        where: { id },
        data: {
          extensionStatus: "REJECTED",
          extensionNote: note || null,
        },
      });

      // Notif ke siswa
      await db.notification.create({
        data: {
          userId: peminjaman.userId,
          title: "Perpanjangan Ditolak",
          message: `Perpanjangan untuk buku "${peminjaman.bukuFisik.judul}" ditolak.${note ? ` Alasan: ${note}` : ""}`,
          type: "EXTEND_REJECTED",
          link: "/akun",
        },
      });

      await logAdminActivityServer({
        action: "REJECT_EXTEND",
        targetType: "PEMINJAMAN",
        targetId: peminjaman.id,
        targetName: `${peminjaman.bukuFisik.judul} - ${peminjaman.user.name || peminjaman.user.username}`,
        changes: { note },
      });

      return NextResponse.json({
        success: true,
        message: "Perpanjangan ditolak",
      });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error approving/rejecting extension:", error);
    return NextResponse.json({ error: "Gagal memproses perpanjangan" }, { status: 500 });
  }
}