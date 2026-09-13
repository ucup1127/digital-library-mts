// app/api/buku-fisik/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    // Hapus kategori terlebih dahulu
    await db.bukuFisikKategori.deleteMany({
      where: { bukuFisikId: id },
    });
    
    await db.bukuFisik.delete({ where: { id } });
    
    return NextResponse.json({ message: "Buku berhasil dihapus" });
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Error deleting buku fisik:", error);
        return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
      }
    }

// PUT - Update buku fisik
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { judul, penulis, penerbit, tahun, isbn, lokasiRak, stok, deskripsi } = body;
    
    if (!judul || !penulis) {
      return NextResponse.json({ error: "Judul dan penulis wajib diisi" }, { status: 400 });
    }
    
    // Hitung stokTersedia (jika stok berkurang, kurangi juga stokTersedia)
    const existingBook = await db.bukuFisik.findUnique({ where: { id } });
    const stokDiff = (stok || 1) - (existingBook?.stok || 1);
    const newStokTersedia = (existingBook?.stokTersedia || 0) + stokDiff;
    
    const updated = await db.bukuFisik.update({
      where: { id },
      data: {
        judul,
        penulis,
        penerbit,
        tahun,
        isbn,
        lokasiRak,
        stok: stok || 1,
        stokTersedia: Math.max(0, newStokTersedia),
        deskripsi,
      },
    });
    
    return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Error updating buku fisik:", error);
        return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
      }
    }