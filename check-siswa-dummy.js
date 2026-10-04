// check-siswa-dummy.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      _count: { select: { peminjamanFisik: true, sessions: true } },
    },
  });

  console.log(`👥 Siswa dummy: ${users.length} orang\n`);

  users.forEach((u) => {
    console.log(`   ${u.email} | ${u.name || "-"} | aktif: ${u.isActive}`);
    console.log(`      → Peminjaman: ${u._count.peminjamanFisik} | Session: ${u._count.sessions}`);
  });

  const activeLoans = await prisma.peminjamanFisik.count({
    where: {
      user: { role: "USER" },
      status: { in: ["DIPINJAM", "TERLAMBAT"] },
    },
  });

  console.log(`\n📕 Peminjaman AKTIF dari siswa: ${activeLoans}`);

  if (activeLoans > 0) {
    console.log("⚠️  Ada peminjaman aktif — perlu di-handle dulu!");
  } else {
    console.log("✅ Aman untuk hapus siswa dummy");
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});