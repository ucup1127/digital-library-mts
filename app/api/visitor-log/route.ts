// app/api/visitor-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, bookId, bookTitle, userId, userEmail, schoolId } = body;
    
    console.log("📝 Received log request:", { action, bookId, bookTitle });
    
    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }
    
    // Catat ke VisitorLog
    const log = await db.visitorLog.create({
      data: {
        action: action,
        bookId: bookId || null,
        bookTitle: bookTitle || null,
        userId: userId || null,
        userEmail: userEmail || null,
        schoolId: schoolId || null,
        sessionId: "web-session",
      },
    });
    
    console.log("✅ Log saved:", log.id);
    
    // Update views buku jika action READ
    if (action === "READ" && bookId) {
      await db.book.update({
        where: { id: bookId },
        data: { views: { increment: 1 } },
      });
      console.log("✅ Book views updated:", bookId);
    }
    
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("❌ Error in visitor-log:", error);
    return NextResponse.json({ 
      error: "Failed to log activity", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}