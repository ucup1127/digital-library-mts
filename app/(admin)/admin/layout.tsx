// app/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/admin/Sidebar";
import IdleLogout from "@/components/IdleLogout";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Belum login → redirect
  if (!session) {
    redirect("/login/admin");
  }

  // Bukan admin → redirect
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Ambil data sekolah dari DB (kalau admin punya schoolId)
  const school = session.schoolId
    ? await db.school.findUnique({
        where: { id: session.schoolId },
        select: { id: true, name: true, logo: true, website: true },
      })
    : null;

  // Cek maintenance mode
  const maintenanceSetting = await db.setting.findUnique({
    where: { key: "maintenance_mode" },
  });
  const isMaintenance = maintenanceSetting?.value === "true";

  return (
    <AdminLayoutClient
      user={{
        userId: session.userId,
        name: session.name || "Admin",
        email: session.email,
        role: session.role,
        schoolId: session.schoolId,
        schoolName: school?.name || "",
        schoolLogo: school?.logo || "",
        schoolWebsite: school?.website || "",
      }}
      isMaintenance={isMaintenance}
    >
      {children}
    </AdminLayoutClient>
  );
}