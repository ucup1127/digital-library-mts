// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Buat School
  await prisma.school.upsert({
    where: { id: "1" },
    update: {},
    create: {
      id: "1",
      name: "MTs Muhammadiyah Patikraja",
      slug: "mts-muhammadiyah-patikraja",
    },
  });
  console.log("✅ School created");

  // Buat Categories
  const categories = ["Fiksi", "Sains", "Sejarah", "Agama", "Teknologi", "Bahasa"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`✅ Category: ${name}`);
  }

  // Buat User Admin dengan password terhash
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await prisma.user.upsert({
    where: { email: "admin@muhpath.sch.id" },
    update: {},
    create: {
      email: "admin@muhpath.sch.id",
      password: hashedPassword,
      name: "Administrator",
      role: "ADMIN",
      schoolId: "1",
    },
  });
  console.log("✅ Admin user created (email: admin@muhpath.sch.id, password: admin123)");

  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });