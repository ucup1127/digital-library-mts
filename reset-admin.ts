// reset-admin.ts
import "dotenv/config";
import { db as prisma } from "./lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "luthfiyusufti@gmail.com";
  const username = "superadmin";
  const newPassword = "admin123";

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Buat baru jika belum ada, atau update jika sudah ada
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "SUPERADMIN",
    },
    create: {
      email,
      username,
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });

  console.log(`✅ Akun Superadmin berhasil disiapkan!`);
  console.log(`📧 Email    : ${user.email}`);
  console.log(`👤 Username : ${user.username}`);
  console.log(`🔐 Password : ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());