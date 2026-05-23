// reset-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash password "admin123" dengan bcrypt
  const hashedPassword = await bcrypt.hash("admin123", 10);
  console.log("Hash baru:", hashedPassword);
  
  // Update password admin
  const admin = await prisma.user.update({
    where: { email: "admin@muhpath.sch.id" },
    data: { password: hashedPassword }
  });
  
  console.log("=".repeat(50));
  console.log("✅ Password admin berhasil direset!");
  console.log("📧 Email:", admin.email);
  console.log("🔐 Password: admin123");
  console.log("🔑 Hash baru:", hashedPassword);
  console.log("=".repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());