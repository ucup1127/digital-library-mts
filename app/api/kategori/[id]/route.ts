// app/api/kategori/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { revalidateTag } from "next/cache";

// DELETE: Hapus kategori berdasarkan ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Cek apakah kategori memiliki buku
    const categoryWithBooks = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });

    if (!categoryWithBooks) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (categoryWithBooks._count.books > 0) {
      return NextResponse.json(
        {
          error: `Tidak bisa menghapus kategori ini karena masih digunakan oleh ${categoryWithBooks._count.books} buku. Hapus atau pindahkan buku tersebut terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id },
    });

    // 🔥 Invalidate cache
    revalidateTag("kategori", "max");
    revalidateTag("admin-stats", "max");

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error deleting category:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
// 🔥 TAMBAHKAN FUNGSI PUT INI UNTUK EDIT KATEGORI
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Validasi nama
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Nama kategori tidak boleh kosong" }, { status: 400 });
    }

    // Cek duplikat (kecuali dirinya sendiri)
    const existingCategory = await db.category.findFirst({
      where: { 
        name: { equals: body.name.trim(), mode: "insensitive" },
        NOT: { id } 
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada!" }, { status: 400 });
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: { name: body.name.trim() },
    });

    // Invalidate cache
    revalidateTag("kategori", "max");
    revalidateTag("admin-stats", "max");

    return NextResponse.json(updatedCategory);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating category:", error);
    return NextResponse.json({ error: "Gagal mengubah kategori" }, { status: 500 });
  }
}