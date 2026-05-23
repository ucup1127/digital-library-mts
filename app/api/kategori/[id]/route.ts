// app/api/kategori/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// DELETE: Hapus kategori berdasarkan ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Cek apakah kategori memiliki buku
    const categoryWithBooks = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } }
    });
    
    if (!categoryWithBooks) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    
    if (categoryWithBooks._count.books > 0) {
      return NextResponse.json({ 
        error: `Tidak bisa menghapus kategori ini karena masih digunakan oleh ${categoryWithBooks._count.books} buku. Hapus atau pindahkan buku tersebut terlebih dahulu.` 
      }, { status: 400 });
    }
    
    await db.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}