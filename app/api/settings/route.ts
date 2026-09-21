// app/api/settings/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET - Ambil setting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    logger.log("📌 GET Setting - key:", key);
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    // Cek apakah model Setting ada
    let setting = null;
    try {
      setting = await db.setting.findUnique({
        where: { key: key },
      });
    } catch (err) {
      logger.error("Database error:", err);
      // Jika tabel belum ada, return default
      return NextResponse.json({ key, value: "false" });
    }
    
    logger.log("📌 Setting found:", setting);
    
    return NextResponse.json({ 
      key, 
      value: setting?.value || "false"
    });
  } catch (error) {
    logger.error("Error getting setting:", error);
    // Return default value instead of error
    return NextResponse.json({ key: "maintenance_mode", value: "false" });
  }
}

// POST - Update setting (hanya untuk SUPER_ADMIN)
export async function POST(request: Request) {
  try {
    // 🔥 Cek session — hanya SUPER_ADMIN yang boleh ubah setting
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang boleh mengubah setting" },
        { status: 403 }
      );
    }
    
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    const setting = await db.setting.upsert({
    where: { key: key },
    update: { value: value || "" },
    create: { key: key, value: value || "" },
  });

  const response = NextResponse.json(setting);

  // 🔥 Set cookie httpOnly untuk maintenance mode (biar proxy bisa baca)
  if (key === "maintenance_mode") {
    response.cookies.set("maintenance_mode", value || "false", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    });
  }

  return response;
  } catch (error) {
    logger.error("Error updating setting:", error);
    return NextResponse.json({ error: "Gagal update setting" }, { status: 500 });
  }
}