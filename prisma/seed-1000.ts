// prisma/seed-1000.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 1000+ books...");
  
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log("Buat kategori dulu ya!");
    return;
  }
  
  const books = [];
  for (let i = 1; i <= 1000; i++) {
    books.push({
      title: `Buku Sample ${i}`,
      author: `Penulis ${Math.floor(Math.random() * 50) + 1}`,
      description: `Deskripsi buku sample ke-${i}. Ini adalah contoh buku untuk testing pagination.`,
      year: `${2020 + (i % 5)}`,
      categoryId: categories[i % categories.length].id,
      schoolId: "1",
      views: Math.floor(Math.random() * 1000),
    });
  }
  
  // Insert batch
  for (let i = 0; i < books.length; i += 100) {
    const batch = books.slice(i, i + 100);
    await prisma.book.createMany({
      data: batch,
    });
    console.log(`Inserted ${i + batch.length} books...`);
  }
  
  console.log("Done! 1000+ books seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());