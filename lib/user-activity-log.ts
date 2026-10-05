// lib/user-activity-log.ts
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

interface LogActivityData {
  userId: string;
  action: string;
  description?: string;
}

export async function logUserActivity(data: LogActivityData) {
  try {
    const session = await getSession();
    const headersList = await headers();

    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      null;

    const userAgent = headersList.get("user-agent") || null;

    await db.userActivityLog.create({
      data: {
        userId: data.userId,
        schoolId: session?.schoolId || null,
        action: data.action,
        description: data.description || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error("Failed to log user activity:", error);
  }
}