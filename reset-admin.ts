// reset-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "luthfiyusufti@gmail.com";
  const newPassword = "admin123";
  
  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update user
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  
  console.log(`✅ Password untuk ${user.email} berhasil direset!`);
  console.log(`🔐 Password baru: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());