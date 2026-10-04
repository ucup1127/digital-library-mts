// cek-admin.js
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
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, email: true, username: true, name: true, role: true, isActive: true },
  });

  console.log(`👤 Admin & Super Admin: ${users.length}\n`);
  users.forEach((u) => {
    console.log(`   ${u.role} | email: ${u.email || "-"} | username: ${u.username || "-"} | ${u.name || "-"} | aktif: ${u.isActive}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });