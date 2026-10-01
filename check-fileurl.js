// check-fileurl.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const books = await prisma.book.findMany({
    select: { id: true, title: true, fileUrl: true },
    take: 10,
  });
  books.forEach((b) => {
    console.log(`📖 ${b.title}`);
    console.log(`   ID:      ${b.id}`);
    console.log(`   fileUrl: ${b.fileUrl}`);
    console.log("");
  });
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});