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
import { getCsrfToken } from "@/lib/csrf-client";

export async function logAdminActivity(data: LogData) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const res = await fetch("/api/admin-log", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to log admin activity:", error);
    return false;
  }
}