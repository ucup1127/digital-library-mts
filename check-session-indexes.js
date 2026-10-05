// check-session-indexes.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const indexes = await prisma.$queryRawUnsafe(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'Session' ORDER BY indexname`
  );
  console.log("Indexes di tabel Session:");
  indexes.forEach((i) => console.log(`  - ${i.indexname}`));
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });