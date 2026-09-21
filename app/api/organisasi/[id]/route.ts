// app/api/organisasi/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();  // ← tambah ini

    const { id } = await params;
    const body = await req.json();

    const { name, position, order } = body;

    if (!name || !position) {
      return NextResponse.json(
        { error: "Nama dan jabatan wajib diisi" },
        { status: 400 }
      );
    }

    const updatedMember = await db.organization.update({
      where: { id },
      data: {
        name,
        position,
        order: typeof order === "number" ? order : 0,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("ERROR PATCH ORGANISASI:", error);
    return NextResponse.json(
      { error: "Gagal update data anggota" },
      { status: 500 }
    );
  }
}