// app/api/buku/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { requireAdmin, AuthError } from "@/lib/auth";

// GET - Ambil detail buku
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const book = await db.book.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    const formattedBook = {
      ...book,
      categoryIds: book.categories.map(bc => bc.category.id)
    };

    return NextResponse.json(formattedBook);
  } catch (error: any) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// PUT - Update buku lengkap (untuk edit)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { title, author, year, description, categories } = body;
    
    if (!title || !author) {
      return NextResponse.json({ error: "Judul dan penulis harus diisi" }, { status: 400 });
    }
    
    const updatedBook = await db.book.update({
      where: { id },
      data: {
        title,
        author,
        year: year || null,
        description: description || null,
      },
    });
    
    if (categories && categories.length > 0) {
      await db.bookCategory.deleteMany({
        where: { bookId: id }
      });
      
      await db.bookCategory.createMany({
        data: categories.map((categoryId: string) => ({
          bookId: id,
          categoryId: categoryId
        }))
      });
    }  
    return NextResponse.json({ 
      success: true, 
      message: "Buku berhasil diperbarui",
      book: updatedBook 
    });
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("PUT error:", error);
      return NextResponse.json({ error: "Gagal memperbarui buku" }, { status: 500 });
    }
  }

// PATCH - Update sebagian (untuk keperluan lain)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { categoryIds, ...bookData } = body;
    
    await db.book.update({
      where: { id },
      data: bookData,
    });
    
    if (categoryIds && categoryIds.length > 0) {
      await db.bookCategory.deleteMany({
        where: { bookId: id }
      });
      
      await db.bookCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          bookId: id,
          categoryId: categoryId
        }))
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("PATCH error:", error);
      return NextResponse.json({ error: "Gagal update" }, { status: 500 });
    }
  }

// DELETE - Hapus buku
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    const book = await db.book.findUnique({ where: { id } });
    
    if (!book) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }
    
    // 🔥 Helper: validasi path biar nggak path traversal
    const safeUnlink = async (url: string | null, subFolder: string) => {
      if (!url) return;
      // Ambil nama file aja (buang folder & ../)
      const fileName = path.basename(url);
      const filePath = path.join(process.cwd(), "public", "uploads", subFolder, fileName);
      
      // Pastikan path di dalam folder uploads
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!filePath.startsWith(uploadsDir)) {
        console.warn("⚠️ Path traversal terdeteksi, skip:", url);
        return;
      }
      
      await unlink(filePath).catch(() => console.log("File tidak ditemukan:", filePath));
    };
    
    // Hapus file PDF (dari folder books)
    await safeUnlink(book.fileUrl, "books");
    
    // Hapus cover (dari folder covers)
    await safeUnlink(book.coverUrl, "covers");

    await db.book.delete({ where: { id } });
    
    return NextResponse.json({ message: "Buku berhasil dihapus!" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Gagal hapus buku" }, { status: 500 });
  }
}