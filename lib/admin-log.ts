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
    const adminId = localStorage.getItem("user_id");
    const adminName = localStorage.getItem("user_name");
    const adminEmail = localStorage.getItem("user_email");
    const adminRole = localStorage.getItem("user_role");
    const schoolId = localStorage.getItem("school_id");

    if (!adminId) return;

    await fetch("/api/admin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminId,
        adminName: adminName || "Unknown",
        adminEmail: adminEmail || "unknown@example.com",
        adminRole: adminRole || "ADMIN",
        schoolId: schoolId || null,
        ...data,
        ipAddress: "client-side",
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}