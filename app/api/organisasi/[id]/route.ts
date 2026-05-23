import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Jangan lupa di-await
    const body = await req.json();
    
    const updatedMember = await db.organization.update({
      where: { id },
      data: {
        name: body.name,
        position: body.position,
        order: body.order,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("ERROR PATCH ORGANISASI:", error);
    return NextResponse.json({ error: "Gagal update data anggota" }, { status: 500 });
  }
}