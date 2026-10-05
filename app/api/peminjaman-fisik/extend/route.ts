// app/api/peminjaman-fisik/extend/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";

const extendSchema = z.object({
  peminjamanId: z.string().min(1, "ID peminjaman wajib diisi"),
  reason: z.string().max(500, "Alasan maksimal 500 karakter").optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const parseResult = extendSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { peminjamanId, reason } = parseResult.data;

    // Cari peminjaman
    const peminjaman = await db.peminjamanFisik.findUnique({
      where: { id: peminjamanId },
      include: {
        bukuFisik: { select: { judul: true } },
        user: { select: { id: true, name: true, username: true, schoolId: true } },
        },
    });

    if (!peminjaman) {
      return NextResponse.json({ error: "Peminjaman tidak ditemukan" }, { status: 404 });
    }

    // Cek kepemilikan
    if (peminjaman.userId !== session.userId) {
      return NextResponse.json({ error: "Bukan peminjaman Anda" }, { status: 403 });
    }

    // Cek status peminjaman
    if (peminjaman.status === "DIKEMBALIKAN") {
      return NextResponse.json({ error: "Buku sudah dikembalikan" }, { status: 400 });
    }

    // Cek sudah pernah perpanjang?
    if (peminjaman.extendedCount >= 1) {
      return NextResponse.json(
        { error: "Perpanjangan hanya bisa 1 kali per peminjaman" },
        { status: 400 }
      );
    }

    // Cek masih PENDING?
    if (peminjaman.extensionStatus === "PENDING") {
      return NextResponse.json(
        { error: "Pengajuan perpanjangan masih menunggu persetujuan admin" },
        { status: 400 }
      );
    }

    // Cek sudah lewat jatuh tempo?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tglKembali = new Date(peminjaman.tglKembali);
    tglKembali.setHours(0, 0, 0, 0);

    if (today > tglKembali) {
      return NextResponse.json(
        { error: "Sudah lewat jatuh tempo. Tidak bisa diperpanjang." },
        { status: 400 }
      );
    }

    // Update status → PENDING
    await db.peminjamanFisik.update({
      where: { id: peminjamanId },
      data: {
        extensionStatus: "PENDING",
        extensionReason: reason || null,
      },
    });

    // Kirim notif ke semua ADMIN di sekolah user
    const admins = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        OR: [
          { schoolId: peminjaman.user.schoolId ?? undefined },
          { role: "SUPER_ADMIN" },
        ],
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Pengajuan Perpanjangan Baru",
          message: `${peminjaman.user.name || peminjaman.user.username} mengajukan perpanjangan untuk buku "${peminjaman.bukuFisik.judul}"`,
          type: "EXTEND_PENDING",
          link: "/admin/peminjaman-fisik",
        })),
      });
    }

    logger.log(`📌 Extend request: ${peminjamanId} by ${session.userId}`);

    return NextResponse.json({
      success: true,
      message: "Pengajuan perpanjangan berhasil dikirim. Menunggu persetujuan admin.",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error extending loan:", error);
    return NextResponse.json({ error: "Gagal mengajukan perpanjangan" }, { status: 500 });
  }
}