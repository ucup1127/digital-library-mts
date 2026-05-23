// prisma/seed-dummy.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Data dummy
const categories = [
  "Fiksi", "Sains", "Sejarah", "Agama", "Teknologi", 
  "Bahasa", "Seni", "Olahraga", "Psikologi", "Filsafat",
  "Ekonomi", "Politik", "Pendidikan", "Kesehatan", "Hukum"
];

const judulBuku = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Ilmu Pengetahuan Alam", 
  "Ilmu Pengetahuan Sosial", "Sejarah Indonesia", "Pendidikan Agama Islam", 
  "Pendidikan Pancasila", "Seni Budaya", "Pendidikan Jasmani", "Fisika", 
  "Kimia", "Biologi", "Ekonomi", "Geografi", "Sosiologi", "Antropologi",
  "Filsafat", "Logika", "Statistika", "Kalkulus", "Aljabar", "Geometri"
];

const penulis = [
  "Prof. Dr. Ahmad Rasyid", "Dr. Siti Nurhaliza", "M. Iqbal, M.Pd",
  "Dr. Budi Santoso", "Prof. Dewi Kartika", "Tim Kemendikbud",
  "Erlangga", "Gramedia", "Yudhistira", "Mizan", "Rineka Cipta",
  "Luthfi Yusuf", "Ahmad Fauzan", "Nadia Putri", "Rizki Ramadan"
];

const sekolahId = "1";

async function main() {
  console.log("🚀 START SEEDING DATA DUMMY...\n");

  // 1. Buat School
  console.log("📚 Creating school...");
  let school = await prisma.school.findUnique({
    where: { id: sekolahId }
  });
  
  if (!school) {
    school = await prisma.school.create({
      data: {
        id: sekolahId,
        name: "MTs Muhammadiyah Patikraja",
        slug: "mts-muhammadiyah-patikraja"
      }
    });
    console.log("✅ School created\n");
  } else {
    console.log("✅ School already exists\n");
  }

  // 2. Buat Categories
  console.log("📌 Creating categories...");
  for (const catName of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: catName }
    });
    if (!existing) {
      await prisma.category.create({
        data: { name: catName }
      });
      console.log(`   Created: ${catName}`);
    }
  }
  
  const allCategories = await prisma.category.findMany();
  console.log(`✅ Categories done! Total: ${allCategories.length}\n`);

  // 3. Buat Users
  console.log("👤 Creating users...");
  
  // Admin User
  await prisma.user.upsert({
    where: { email: "admin@muhpath.sch.id" },
    update: {},
    create: {
      email: "admin@muhpath.sch.id",
      password: "admin123",
      name: "Administrator",
      role: "ADMIN",
      schoolId: sekolahId
    }
  });
  console.log("✅ Admin user: admin@muhpath.sch.id / admin123");

  // Regular User
  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      password: "user123",
      name: "User Biasa",
      role: "USER",
      schoolId: sekolahId
    }
  });
  console.log("✅ Regular user: user@example.com / user123\n");

  // 4. Generate Books
  console.log("📖 Generating books...");
  
  const existingBooks = await prisma.book.count();
  console.log(`   Existing books: ${existingBooks}`);
  
  const targetBooks = 150;
  const booksToAdd = targetBooks - existingBooks;
  
  if (booksToAdd <= 0) {
    console.log(`   Already have ${existingBooks} books\n`);
  } else {
    console.log(`   Adding ${booksToAdd} new books...\n`);
    
    const books = [];
    for (let i = 1; i <= booksToAdd; i++) {
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      const randomJudul = judulBuku[i % judulBuku.length] + " " + Math.floor(i / judulBuku.length + 1);
      const randomPenulis = penulis[Math.floor(Math.random() * penulis.length)];
      const randomTahun = 2015 + Math.floor(Math.random() * 10);
      const randomViews = Math.floor(Math.random() * 500);
      
      books.push({
        title: randomJudul,
        author: randomPenulis,
        description: `Buku ini membahas tentang ${randomJudul.toLowerCase()} secara mendalam.`,
        year: randomTahun.toString(),
        categoryId: randomCategory.id,
        schoolId: sekolahId,
        views: randomViews,
        coverUrl: null,
        fileUrl: null,
        isShared: true,
      });
    }
    
    for (let i = 0; i < books.length; i += 50) {
      const batch = books.slice(i, i + 50);
      await prisma.book.createMany({ data: batch });
      console.log(`   📚 Inserted ${i + batch.length} of ${books.length} books...`);
    }
  }
  
  // Final Stats
  const finalBooks = await prisma.book.count();
  const finalCategories = await prisma.category.count();
  const finalUsers = await prisma.user.count();
  const totalViews = await prisma.book.aggregate({ _sum: { views: true } });

  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEEDING COMPLETED!");
  console.log("=".repeat(50));
  console.log(`📚 Total Books: ${finalBooks}`);
  console.log(`📌 Total Categories: ${finalCategories}`);
  console.log(`👥 Total Users: ${finalUsers}`);
  console.log(`📊 Total Views: ${totalViews._sum.views || 0}`);
  console.log("=".repeat(50));
  console.log("\n🔐 LOGIN CREDENTIALS:");
  console.log("   ADMIN: admin@muhpath.sch.id / admin123");
  console.log("   USER:  user@example.com / user123");
  console.log("\n📖 Buka dashboard: http://localhost:3000/admin");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });