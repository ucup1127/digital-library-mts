// scripts/backfill-member-id.ts
import "./load-env";  // ← WAJIB paling atas
import { db } from "@/lib/db";
import { generateMemberId } from "@/lib/member-id";

async function main() {
  console.log("🔍 Mencari user tanpa memberId...");

  const usersWithoutMemberId = await db.user.findMany({
    where: {
      memberId: null,
      role: "USER",
      schoolId: { not: null },
    },
    select: { id: true, schoolId: true, email: true },
  });

  console.log(`📊 Ditemukan ${usersWithoutMemberId.length} user tanpa memberId`);

  if (usersWithoutMemberId.length === 0) {
    console.log("✅ Semua user sudah punya memberId");
    return;
  }

  for (const user of usersWithoutMemberId) {
    if (!user.schoolId) continue;

    const memberId = await generateMemberId(user.schoolId);

    await db.user.update({
      where: { id: user.id },
      data: { memberId, barcode: memberId },
    });

    console.log(`✅ ${user.email} → ${memberId}`);
  }

  console.log("🎉 Backfill selesai!");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());