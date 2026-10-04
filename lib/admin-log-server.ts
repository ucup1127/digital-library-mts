import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { LogData } from "@/lib/admin-log";

/**
 * Log aktivitas admin — SERVER-SIDE.
 * Langsung tulis ke DB pakai session.
 */
export async function logAdminActivityServer(data: LogData) {
  try {
    const session = await getSession();
    if (!session) {
      logger.warn("logAdminActivityServer: no session, skip log");
      return;
    }

    await db.adminLog.create({
    data: {
      adminId: session.userId,
      adminName: session.name ?? "Unknown",
      adminEmail: session.email ?? "",   // ← handle null
      adminRole: session.role,
      schoolId: session.schoolId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId ?? null,
      targetName: data.targetName ?? null,
      changes: data.changes ?? undefined,
    },
  });
  } catch (error) {
    logger.error("Failed to log admin activity (server):", error);
  }
}