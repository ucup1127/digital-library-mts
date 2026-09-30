// app/api/settings/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { updateSettingSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { unstable_cache, revalidateTag } from "next/cache";

// ============================================
// Cache function — per key
// ============================================
const getCachedSetting = unstable_cache(
  async (key: string) => {
    const setting = await db.setting.findUnique({
      where: { key },
    });
    return setting?.value || "false";
  },
  ["setting-by-key"],
  { revalidate: 300, tags: ["settings"] }
);

// ============================================
// GET — Ambil setting (SUPER_ADMIN only)
// ============================================
export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: hanya SUPER_ADMIN
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang boleh membaca setting" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    logger.log("📌 GET Setting - key:", key);

    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }

    let value = "false";
    try {
      value = await getCachedSetting(key);
    } catch (err) {
      logger.error("Database error:", err);
      // Kalau tabel belum ada, return default
      return NextResponse.json({ key, value: "false" });
    }

    return NextResponse.json({ key, value });
  } catch (error) {
    logger.error("Error getting setting:", error);
    return NextResponse.json({ key: "maintenance_mode", value: "false" });
  }
}

// ============================================
// POST — Update setting (SUPER_ADMIN only)
// ============================================
export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = updateSettingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { key, value } = parseResult.data;

    const setting = await db.setting.upsert({
      where: { key },
      update: { value: value || "" },
      create: { key, value: value || "" },
    });

    const response = NextResponse.json(setting);

    // Set cookie maintenance mode
    if (key === "maintenance_mode") {
      response.cookies.set("maintenance_mode", value || "false", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }

    // 🔥 Log audit
    await logAdminActivityServer({
      action: "UPDATE_SETTING",
      targetType: "SETTING",
      targetId: setting.id,
      targetName: key,
      changes: { value },
    });

    // 🔥 Invalidate cache
    revalidateTag("settings", "max");

    return response;
  } catch (error) {
    logger.error("Error updating setting:", error);
    return NextResponse.json({ error: "Gagal update setting" }, { status: 500 });
  }
}