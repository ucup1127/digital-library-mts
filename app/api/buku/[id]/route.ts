// app/api/buku/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { cacheDel } from "@/lib/redis";

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    
    // 🔥 HAPUS CACHE 🔥
    await cacheDel(`books:*`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Buku berhasil diperbarui",
      book: updatedBook 
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Gagal memperbarui buku" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    
    // 🔥 HAPUS CACHE 🔥
    await cacheDel(`books:*`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const book = await db.book.findUnique({ where: { id } });
    
    // Hapus file PDF jika ada
    if (book?.fileUrl) {
      const filePath = path.join(process.cwd(), "public", book.fileUrl);
      await unlink(filePath).catch(() => console.log("File tidak ditemukan"));
    }
    
    // Hapus cover jika ada
    if (book?.coverUrl) {
      const coverPath = path.join(process.cwd(), "public", book.coverUrl);
      await unlink(coverPath).catch(() => console.log("Cover tidak ditemukan"));
    }

    await db.book.delete({ where: { id } });
    
    // HAPUS CACHE
    await cacheDel(`books:*`);
    
    return NextResponse.json({ message: "Buku berhasil dihapus!" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Gagal hapus buku" }, { status: 500 });
  }
}