// scripts/migrate-passwords.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function migratePasswords() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Jika password belum di-hash (tidak dimulai dengan $2b$)
    if (!user.password.startsWith("$2b$")) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`✅ Migrated: ${user.email} (${user.name})`);
    } else {
      console.log(`⏭️ Skip (already hashed): ${user.email}`);
    }
  }
  
  console.log("🎉 Migrasi selesai!");
}

migratePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());