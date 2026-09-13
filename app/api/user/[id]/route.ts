// app/api/user/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // 🔥 Cek: user cuma bisa lihat profil sendiri (kecuali admin)
    if (
      session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN" &&
      session.userId !== id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    console.log("Fetching user with ID:", id);
    
    if (!id) {
      return NextResponse.json({ error: "ID user diperlukan" }, { status: 400 });
    }
    
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        className: true,
        memberId: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      console.log("User not found:", id);
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    console.log("User found:", user.name);
    return NextResponse.json(user);
   } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Gagal memuat data user" }, { status: 500 });
  }
}