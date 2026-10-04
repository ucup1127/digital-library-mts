// backup-via-prisma.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 Backup data...\n");

  const data = {
    schools: await prisma.school.findMany(),
    users: await prisma.user.findMany(),
    books: await prisma.book.findMany(),
    categories: await prisma.category.findMany(),
    bukuFisik: await prisma.bukuFisik.findMany(),
    peminjamanFisik: await prisma.peminjamanFisik.findMany(),
    adminLogs: await prisma.adminLog.findMany(),
    visitorLogs: await prisma.visitorLog.findMany(),
    sessions: await prisma.session.findMany(),
    settings: await prisma.setting.findMany(),
    schoolProfiles: await prisma.schoolProfile.findMany(),
    galleries: await prisma.gallery.findMany(),
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-sebelum-nisn-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log("✅ Backup tersimpan:", filename);
  console.log("\n📊 Statistik:");
  Object.entries(data).forEach(([key, val]) => {
    console.log(`   ${key.padEnd(20)}: ${val.length}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});