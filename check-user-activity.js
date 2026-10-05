// check-user-activity.js
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const logs = await prisma.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true, username: true } },
    },
  });

  console.log(`📋 Total log terakhir: ${logs.length}\n`);
  logs.forEach((l) => {
    console.log(`[${l.createdAt.toLocaleString("id-ID")}] ${l.action}`);
    console.log(`   User: ${l.user.name || l.user.username || l.user.email}`);
    console.log(`   Desc: ${l.description || "-"}`);
    console.log(`   IP: ${l.ipAddress || "-"}`);
    console.log("");
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });