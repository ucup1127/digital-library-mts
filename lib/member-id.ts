// lib/member-id.ts
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Generate memberId unik untuk ADMIN/SUPER_ADMIN.
 * Format: MTS001, MTS002, dst.
 *
 * ⚠️ memberId unique GLOBAL — cari max dari SEMUA user, bukan per sekolah.
 */
export async function generateMemberId(schoolId: string | null): Promise<string> {
  // 🔥 FIX: Cari max dari SEMUA user dengan memberId format MTSxxx
  const allUsers = await db.user.findMany({
    where: {
      memberId: { startsWith: "MTS" },
    },
    select: { memberId: true },
  });

  // Cari angka terbesar dari SEMUA sekolah
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

  // Retry kalau duplikat — max 100x
  let attempts = 0;
  const maxAttempts = 100;
  while (attempts < maxAttempts) {
    const existing = await db.user.findFirst({
      where: { memberId },
      select: { id: true },
    });

    if (!existing) break;

    attempts++;
    memberId = `MTS${String(newNumber + attempts).padStart(3, "0")}`;
  }

  if (attempts >= maxAttempts) {
    // Fallback: pakai timestamp kalau 100x retry gagal
    memberId = `MTS${Date.now().toString().slice(-6)}`;
  }

  logger.log(`📌 Generated memberId (global): ${memberId}`);
  return memberId;
}