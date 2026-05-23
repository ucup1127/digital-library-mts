// create-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  // Cek apakah school dengan id "1" ada
  let school = await prisma.school.findUnique({
    where: { id: "1" }
  });
  
  if (!school) {
    school = await prisma.school.create({
      data: {
        id: "1",
        name: "MTs Muhammadiyah Patikraja",
        slug: "mts-muhammadiyah-patikraja"
      }
    });
    console.log("✅ School created");
  }
  
  // Buat admin baru
  const admin = await prisma.user.create({
    data: {
      email: "admin@muhpath.sch.id",
      password: hashedPassword,
      name: "Administrator",
      role: "ADMIN",
      schoolId: "1",
    },
  });
  
  console.log("=".repeat(50));
  console.log("🎉 ADMIN BARU BERHASIL DIBUAT!");
  console.log("=".repeat(50));
  console.log("📧 Email:", admin.email);
  console.log("🔐 Password: admin123");
  console.log("=".repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
  