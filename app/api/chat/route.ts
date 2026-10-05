// app/api/chat/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const sendMessageSchema = z.object({
  message: z
    .string({ message: "Pesan wajib diisi" })
    .min(1, "Pesan tidak boleh kosong")
    .max(2000, "Pesan maksimal 2000 karakter")
    .trim(),
});

// 🔥 Rate limit: max 10 pesan/menit per admin
const CHAT_RATE_LIMIT = 10;
const CHAT_RATE_WINDOW = 60 * 1000; // 1 menit

// ============================================
// GET — Ambil pesan
// ============================================
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: any = {};

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

    return NextResponse.json({
      messages: messages.reverse(),
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
    const ip = getClientIp(request);

    // 🔥 Rate limit per user
    const rateKey = `chat:${session.userId}`;
    const rateCheck = checkRateLimit(rateKey, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW);

    if (!rateCheck.allowed) {
      logger.log(`🚫 Chat rate limit exceeded: ${session.userId}`);
      return NextResponse.json(
        {
          error: `Terlalu banyak kirim pesan. Coba lagi dalam ${Math.ceil((rateCheck.retryAfter || 0) / 1000)} detik.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter || 60) },
        }
      );
    }

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

    // 🔥 Update lastReadAt untuk pengirim sendiri (biar pesan sendiri nggak dihitung unread)
    await db.chatReadState.upsert({
      where: { userId: session.userId },
      update: { lastReadAt: new Date() },
      create: { userId: session.userId, lastReadAt: new Date() },
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