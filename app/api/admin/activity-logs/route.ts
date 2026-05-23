// app/api/admin/activity-logs/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";
    const user = searchParams.get("user") || "";
    const date = searchParams.get("date") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    
    const where: any = {};
    
    if (action) where.action = action;
    if (user) where.userEmail = { contains: user, mode: "insensitive" };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { gte: startDate, lt: endDate };
    }
    
    const activities = await db.visitorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ activities: [] }, { status: 500 });
  }
}