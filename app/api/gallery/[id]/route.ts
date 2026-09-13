// app/api/gallery/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

// PUT - Update galeri
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { title, description, category } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
    }
    
    const updated = await db.gallery.update({
      where: { id },
      data: {
        title,
        description: description || "",
        category: category || "kegiatan",
      },
    });
    
    return NextResponse.json(updated);
    } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error updating gallery:", error);
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

// DELETE - Hapus galeri
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.gallery.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
      } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error deleting gallery:", error);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}