// lib/admin-log.ts
interface LogData {
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  changes?: any;
}

export async function logAdminActivity(data: LogData) {
  try {
    await fetch("/api/admin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}