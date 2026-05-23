// lib/system-log.ts
import { db } from "./db";

interface SystemLogData {
  level: "ERROR" | "WARNING" | "INFO";
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function systemLog(data: SystemLogData) {
  try {
    // Simpan ke database
    await db.systemLog.create({
      data: {
        level: data.level,
        message: data.message,
        stack: data.stack || null,
        path: data.path || null,
        method: data.method || null,
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
      },
    });
    
    // Juga tampilkan di console untuk development
    if (process.env.NODE_ENV === "development") {
      console.log(`[${data.level}] ${data.message}`, {
        path: data.path,
        method: data.method,
      });
    }
  } catch (error) {
    console.error("Gagal menyimpan system log:", error);
  }
}

// Fungsi khusus untuk error
export async function logError(error: Error, context?: {
  path?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
}) {
  await systemLog({
    level: "ERROR",
    message: error.message,
    stack: error.stack,
    path: context?.path,
    method: context?.method,
    userId: context?.userId,
    userEmail: context?.userEmail,
  });
}

// Fungsi khusus untuk warning
export async function logWarning(message: string, context?: {
  path?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
}) {
  await systemLog({
    level: "WARNING",
    message,
    path: context?.path,
    method: context?.method,
    userId: context?.userId,
    userEmail: context?.userEmail,
  });
}

// Fungsi khusus untuk info
export async function logInfo(message: string, context?: {
  path?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
}) {
  await systemLog({
    level: "INFO",
    message,
    path: context?.path,
    method: context?.method,
    userId: context?.userId,
    userEmail: context?.userEmail,
  });
}