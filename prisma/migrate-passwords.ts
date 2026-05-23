// prisma/migrate-passwords.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function migratePasswords() {
  try {
    console.log("🔍 Memeriksa password users...");
    
    const users = await prisma.user.findMany();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Jika password belum di-hash (tidak dimulai dengan $2b$)
      if (!user.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        console.log(`✅ Migrated: ${user.email} (${user.name || "no name"})`);
        migrated++;
      } else {
        console.log(`⏭️ Skip (already hashed): ${user.email}`);
        skipped++;
      }
    }
    
    console.log(`\n🎉 Migrasi selesai!`);
    console.log(`   - ${migrated} user berhasil di-migrate`);
    console.log(`   - ${skipped} user sudah hash`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();