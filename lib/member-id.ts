// lib/member-id.ts
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Generate memberId unik untuk ADMIN/SUPER_ADMIN di sekolah tertentu.
 * Format: MTS001, MTS002, dst.
 * 
 * ⚠️ Untuk SISWA (role USER), memberId = NISN (di-handle di register route).
 */
export async function generateMemberId(schoolId: string | null): Promise<string> {
  // Ambil semua memberId yang format MTSxxx (admin only)
  const allUsers = await db.user.findMany({
    where: {
      schoolId: schoolId || undefined,
      memberId: { startsWith: "MTS" },
    },
    select: { memberId: true },
  });

  // Cari angka terbesar
  let maxNumber = 0;
  for (const u of allUsers) {
    if (u.memberId) {
      const num = parseInt(u.memberId.replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const newNumber = maxNumber + 1;
  let memberId = `MTS${String(newNumber).padStart(3, "0")}`;

  // Retry kalau duplikat
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    const existing = await db.user.findFirst({
      where: { memberId },
      select: { id: true },
    });

    if (!existing) break;

    attempts++;
    memberId = `MTS${String(newNumber + attempts).padStart(3, "0")}`;
  }

  logger.log(`📌 Generated memberId (admin): ${memberId}`);
  return memberId;
}