// app/api/buku/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { updateBookSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// GET - Ambil detail buku
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const book = await db.book.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        school: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    const formattedBook = {
      ...book,
      categoryIds: book.categories.map((bc) => bc.category.id),
    };

    return NextResponse.json(formattedBook);
  } catch (error: any) {
    logger.error("GET error:", error);
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// PUT - Update buku lengkap
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parseResult = updateBookSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { title, author, year, description, categories, isShared } = parseResult.data;

    // 🔥 Cek owner — cuma owner yang bisa edit
    const existing = await db.book.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    if (
      session.role !== "SUPER_ADMIN" &&
      session.schoolId !== existing.schoolId
    ) {
      return NextResponse.json(
        { error: "Hanya pemilik buku (sekolah uploader) yang bisa edit" },
        { status: 403 }
      );
    }

    const updatedBook = await db.book.update({
      where: { id },
      data: {
        title,
        author,
        year: year || null,
        description: description || null,
        ...(isShared !== undefined ? { isShared } : {}),
      },
    });

    if (categories && categories.length > 0) {
      await db.bookCategory.deleteMany({ where: { bookId: id } });
      await db.bookCategory.createMany({
        data: categories.map((categoryId) => ({ bookId: id, categoryId })),
      });
    }

    await logAdminActivityServer({
      action: "UPDATE",
      targetType: "BOOK",
      targetId: updatedBook.id,
      targetName: updatedBook.title,
      changes: { isShared: updatedBook.isShared },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json({
      success: true,
      message: "Buku berhasil diperbarui",
      book: updatedBook,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("PUT error:", error);
    return NextResponse.json({ error: "Gagal memperbarui buku" }, { status: 500 });
  }
}

// PATCH - Update sebagian
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { categoryIds, ...bookData } = body;

    // Cek owner
    const existing = await db.book.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    if (
      session.role !== "SUPER_ADMIN" &&
      session.schoolId !== existing.schoolId
    ) {
      return NextResponse.json(
        { error: "Hanya pemilik buku yang bisa edit" },
        { status: 403 }
      );
    }

    await db.book.update({
      where: { id },
      data: bookData,
    });

    if (categoryIds && categoryIds.length > 0) {
      await db.bookCategory.deleteMany({ where: { bookId: id } });
      await db.bookCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          bookId: id,
          categoryId: categoryId,
        })),
      });
    }

    revalidateTag("admin-stats", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("PATCH error:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

// DELETE - Hapus buku
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const book = await db.book.findUnique({ where: { id } });

    if (!book) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    // 🔥 Cek owner
    if (
      session.role !== "SUPER_ADMIN" &&
      session.schoolId !== book.schoolId
    ) {
      return NextResponse.json(
        { error: "Hanya pemilik buku (sekolah uploader) yang bisa hapus" },
        { status: 403 }
      );
    }

    const safeUnlink = async (url: string | null, subFolder: string) => {
      if (!url) return;
      const fileName = path.basename(url);
      const filePath = path.join(process.cwd(), "public", "uploads", subFolder, fileName);
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!filePath.startsWith(uploadsDir)) {
        logger.warn("⚠️ Path traversal terdeteksi, skip:", url);
        return;
      }
      await unlink(filePath).catch(() => logger.log("File tidak ditemukan:", filePath));
    };

    await safeUnlink(book.fileUrl, "books");
    await safeUnlink(book.coverUrl, "covers");

    await db.book.delete({ where: { id } });

    await logAdminActivityServer({
      action: "DELETE",
      targetType: "BOOK",
      targetId: book.id,
      targetName: book.title,
      changes: { isShared: book.isShared },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json({ message: "Buku berhasil dihapus!" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("DELETE error:", error);
    return NextResponse.json({ error: "Gagal hapus buku" }, { status: 500 });
  }
}