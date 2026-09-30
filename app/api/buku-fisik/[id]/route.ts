// app/api/buku-fisik/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { updateBukuFisikSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Ambil data dulu buat log
    const buku = await db.bukuFisik.findUnique({
      where: { id },
      select: { id: true, judul: true },
    });

    if (!buku) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    // Hapus kategori dulu
    await db.bukuFisikKategori.deleteMany({
      where: { bukuFisikId: id },
    });

    await db.bukuFisik.delete({ where: { id } });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "DELETE",
      targetType: "BUKU_FISIK",
      targetId: buku.id,
      targetName: buku.judul,
    });

    return NextResponse.json({ message: "Buku berhasil dihapus" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error deleting buku fisik:", error);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // 🔥 Validasi pakai Zod
    const parseResult = updateBukuFisikSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { judul, penulis, penerbit, tahun, isbn, lokasiRak, stok, deskripsi } = parseResult.data;

    const existingBook = await db.bukuFisik.findUnique({ where: { id } });
    if (!existingBook) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    // Hitung stok tersedia
    const stokDiff = stok - existingBook.stok;
    const newStokTersedia = existingBook.stokTersedia + stokDiff;

    const updated = await db.bukuFisik.update({
      where: { id },
      data: {
        judul,
        penulis,
        penerbit,
        tahun,
        isbn,
        lokasiRak,
        stok,
        stokTersedia: Math.max(0, newStokTersedia),
        deskripsi,
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "UPDATE",
      targetType: "BUKU_FISIK",
      targetId: updated.id,
      targetName: updated.judul,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating buku fisik:", error);
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}