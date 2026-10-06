// check-school-website.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, slug: true, website: true },
  });

  console.log(`🏫 Total: ${schools.length}\n`);
  schools.forEach((s) => {
    console.log(`📌 ${s.name}`);
    console.log(`   Website: ${s.website || "❌ KOSONG"}`);
    console.log("");
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });