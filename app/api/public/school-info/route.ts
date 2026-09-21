// app/api/public/school-info/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSession();

    // Kalau login & punya schoolId → pakai sekolah user
    if (session?.schoolId) {
      const school = await db.school.findUnique({
        where: { id: session.schoolId },
        select: { id: true, name: true, logo: true, website: true },
      });

      if (school) {
        return NextResponse.json({
          id: school.id,
          name: school.name,
          logo: school.logo || "",
          website:
            school.website ||
            "https://mtsmuhammadiyahpatikraja.sch.id",
        });
      }
    }

    // Fallback: sekolah pertama
    const defaultSchool = await db.school.findFirst({
      select: { id: true, name: true, logo: true, website: true },
    });

    if (defaultSchool) {
      return NextResponse.json({
        id: defaultSchool.id,
        name: defaultSchool.name,
        logo: defaultSchool.logo || "",
        website:
          defaultSchool.website ||
          "https://mtsmuhammadiyahpatikraja.sch.id",
      });
    }

    // Nggak ada sekolah sama sekali
    return NextResponse.json({
      name: "Perpustakaan Digital",
      logo: "",
      website: "https://mtsmuhammadiyahpatikraja.sch.id",
    });
  } catch (error) {
    logger.error("Error fetching school info:", error);
    return NextResponse.json(
      { error: "Gagal memuat info sekolah" },
      { status: 500 }
    );
  }
}