// hapus-siswa-dummy.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🗑️  Menghapus siswa dummy...\n");

  // Ambil data dulu buat log
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, email: true, name: true },
  });

  console.log(`Akan dihapus: ${users.length} user`);
  users.forEach((u) => console.log(`   - ${u.email} (${u.name || "-"})`));
  console.log("");

  // Hapus (cascade ke Session, PeminjamanFisik)
  const result = await prisma.user.deleteMany({
    where: { role: "USER" },
  });

  console.log(`✅ Berhasil dihapus: ${result.count} user`);

  // Verify
  const remaining = await prisma.user.count({ where: { role: "USER" } });
  console.log(`📊 Sisa siswa: ${remaining}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});