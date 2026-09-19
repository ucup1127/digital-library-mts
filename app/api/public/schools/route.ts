// app/api/public/schools/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Error fetching public schools:", error);
    return NextResponse.json([], { status: 500 });
  }
}