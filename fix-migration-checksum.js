// fix-migration-checksum.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const migrationName = "20261001100813_add_pg_trgm";
  const filePath = `prisma/migrations/${migrationName}/migration.sql`;

  console.log("📄 Baca migration file:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("❌ File migration tidak ditemukan!");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");

  // Prisma pakai SHA-256 hex
  const checksum = crypto.createHash("sha256").update(content).digest("hex");

  console.log("🔑 Checksum baru:", checksum);

  // Cek checksum di DB sekarang
  const before = await prisma.$queryRawUnsafe(
    `SELECT migration_name, checksum FROM "_prisma_migrations" WHERE migration_name = $1`,
    migrationName
  );

  console.log("📋 Sebelum:", before);

  // Update checksum
  await prisma.$executeRawUnsafe(
    `UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = $2`,
    checksum,
    migrationName
  );

  console.log("✅ Checksum updated di DB");

  // Verify
  const after = await prisma.$queryRawUnsafe(
    `SELECT migration_name, checksum FROM "_prisma_migrations" WHERE migration_name = $1`,
    migrationName
  );

  console.log("📋 Sesudah:", after);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});