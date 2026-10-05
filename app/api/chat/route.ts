// app/api/chat/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";

// ============================================
// SCHEMA
// ============================================
const sendMessageSchema = z.object({
  message: z
    .string({ message: "Pesan wajib diisi" })
    .min(1, "Pesan tidak boleh kosong")
    .max(2000, "Pesan maksimal 2000 karakter")
    .trim(),
});

// ============================================
// GET — Ambil pesan (polling)
// Query params:
//   ?since=<ISO timestamp>  → ambil pesan setelah timestamp
//   ?limit=50               → jumlah pesan (default 50)
// ============================================
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: any = {};

    // Kalau ada ?since → cuma ambil pesan baru
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gt: sinceDate };
      }
    }

    const messages = await db.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            schoolId: true,
            school: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Reverse biar urut dari lama ke baru
    const ordered = messages.reverse();

    return NextResponse.json({
      messages: ordered,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Chat GET error:", error);
    return NextResponse.json({ messages: [], error: "Gagal memuat chat" }, { status: 500 });
  }
}

// ============================================
// POST — Kirim pesan baru
// ============================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const parseResult = sendMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { message } = parseResult.data;

    const newMessage = await db.chatMessage.create({
      data: {
        userId: session.userId,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            schoolId: true,
            school: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    logger.log(`💬 Chat message from ${session.userId}`);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Chat POST error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}