// app/api/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    logger.log("🔍 SEARCH USER:", { barcode, search, limit });
    
    // 🔍 Cari user berdasarkan barcode (scan)
    if (barcode) {
      const user = await db.user.findFirst({
        where: { 
          OR: [
            { barcode: barcode },
            { memberId: barcode },
          ],
          // 🔥 EXCLUDE SUPER_ADMIN
          role: { not: "SUPER_ADMIN" },
        },
        select: {
          id: true,
          name: true,
          email: true,
          className: true,
          memberId: true,
          barcode: true,
        },
      });
      
      if (!user) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }
      
      logger.log("✅ User ditemukan:", user.name, "memberId:", user.memberId);
      
      return NextResponse.json({ user });
    }
    
    // 🔍 Cari user berdasarkan nama/email/memberId (ketik manual)
    if (search && search.length >= 2) {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { memberId: { contains: search, mode: "insensitive" } },
          ],
          // 🔥 EXCLUDE SUPER_ADMIN
          role: { not: "SUPER_ADMIN" },
        },
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          className: true,
          memberId: true,
          barcode: true,
        },
      });
      
      logger.log(`✅ Menemukan ${users.length} user`);
      
      return NextResponse.json({ users });
    }
    
    return NextResponse.json({ users: [] });
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        logger.error("Error fetching users:", error);
        return NextResponse.json({ error: "Gagal memuat user" }, { status: 500 });
      }
    }