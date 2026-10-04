// isi-username-admin.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update admin 1
  await prisma.user.update({
    where: { email: "Admin1@gmail.com" },
    data: { username: "admin1" },
  });
  
  // Update admin 2
  await prisma.user.update({
    where: { email: "admin2@gmail.com" },
    data: { username: "admin2" },
  });
  
  // Update superadmin
  await prisma.user.update({
    where: { email: "superadmin@muhpath.sch.id" },
    data: { username: "superadmin" },
  });

  console.log("✅ Username admin di-set:");
  
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { email: true, username: true, role: true },
  });
  
  users.forEach((u) => console.log(`   ${u.role} | ${u.email} | @${u.username}`));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });