// fix-session-index.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔧 Fix session indexes...\n");

  // Cek index
  const indexes = await prisma.$queryRawUnsafe(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'Session'`
  );
  const indexNames = indexes.map((i) => i.indexname);

  // Index 1: Session_csrfToken_key (unique) — cek
  if (!indexNames.includes("Session_csrfToken_key")) {
    console.log("➕ Bikin Session_csrfToken_key (unique)...");
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX "Session_csrfToken_key" ON "Session"("csrfToken")`
    );
  } else {
    console.log("✅ Session_csrfToken_key udah ada");
  }

  // Index 2: Session_csrfToken_idx (non-unique) — yang Prisma detect drift
  if (!indexNames.includes("Session_csrfToken_idx")) {
    console.log("➕ Bikin Session_csrfToken_idx...");
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "Session_csrfToken_idx" ON "Session"("csrfToken")`
    );
  } else {
    console.log("✅ Session_csrfToken_idx udah ada");
  }

  // Verify
  const final = await prisma.$queryRawUnsafe(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'Session' ORDER BY indexname`
  );
  console.log("\n✅ Final indexes:");
  final.forEach((i) => console.log(`   - ${i.indexname}`));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });