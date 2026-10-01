// app/api/public/schools/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";

// ============================================
// Cache function
// ============================================
const getCachedPublicSchools = unstable_cache(
  async () => {
    return db.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["public-schools-list"],
  { revalidate: 300, tags: ["schools-public"] }
);

export async function GET() {
  try {
    const schools = await getCachedPublicSchools();
    return NextResponse.json(schools);
  } catch (error) {
    logger.error("Error fetching public schools:", error);
    return NextResponse.json([], { status: 500 });
  }
}