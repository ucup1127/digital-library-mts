// app/api/user/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Gagal memuat data user" }, { status: 500 });
  }
}