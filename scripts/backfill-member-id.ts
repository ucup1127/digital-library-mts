// scripts/backfill-member-id.ts
import { db } from "@/lib/db";
import { generateMemberId } from "@/lib/member-id";
import { logger } from "@/lib/logger";

async function main() {
  const usersWithoutMemberId = await db.user.findMany({
    where: {
      memberId: null,
      role: "USER",
      schoolId: { not: null },
    },
    select: { id: true, schoolId: true, email: true },
  });

  logger.log(`Found ${usersWithoutMemberId.length} users without memberId`);

  for (const user of usersWithoutMemberId) {
    if (!user.schoolId) continue;

    const memberId = await generateMemberId(user.schoolId);

    await db.user.update({
      where: { id: user.id },
      data: { memberId, barcode: memberId },
    });

    logger.log(`✅ ${user.email} → ${memberId}`);
  }

  logger.log("Done!");
}

main()
  .catch(logger.error)
  .finally(() => db.$disconnect());