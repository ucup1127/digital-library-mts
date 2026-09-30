// lib/admin-log-client.ts
import { logger } from "@/lib/logger";

export interface LogData {
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  changes?: any;
}

/**
 * Log aktivitas admin — CLIENT-SIDE ONLY.
 * Kirim ke /api/admin-log, endpoint yang lengkapi data admin dari session.
 */
export async function logAdminActivity(data: LogData) {
  try {
    await fetch("/api/admin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    logger.error("Failed to log admin activity (client):", error);
  }
}