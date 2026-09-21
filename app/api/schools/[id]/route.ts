// app/api/schools/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireSuperAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET - Ambil detail sekolah
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const school = await db.school.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        books: { select: { id: true } },
      },
    });
    
    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(school);
  } catch (error) {
    logger.error("GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT - Update sekolah
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, slug, logo } = body;
    
    if (!name || !slug) {
      return NextResponse.json({ error: "Nama dan slug harus diisi" }, { status: 400 });
    }
    
    const updatedSchool = await db.school.update({
      where: { id },
      data: { 
        name, 
        slug,
        logo: logo || null,
      },
    });
    
    return NextResponse.json(updatedSchool);
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        logger.error("Update school error:", error);
        return NextResponse.json({ error: "Gagal memperbarui sekolah" }, { status: 500 });
      }
    }

// DELETE - Hapus sekolah
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(); 
    const { id } = await params;
    
    const school = await db.school.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        books: { select: { id: true } },
      },
    });
    
    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    
    await db.school.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Sekolah "${school.name}" berhasil dihapus`,
      deletedUsers: school.users.length,
      deletedBooks: school.books.length,
    });
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        logger.error("Delete school error:", error);
        return NextResponse.json({ error: "Gagal menghapus sekolah" }, { status: 500 });
      }
    }