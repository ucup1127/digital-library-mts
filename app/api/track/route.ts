// app/api/track/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, userAgent, ip } = body;
    
    let action = 'view_page';
    let bookId = null;
    let bookTitle = null;
    
    // Extract book ID dari path
    const bookMatch = path?.match(/\/katalog\/([^\/]+)/);
    if (bookMatch) {
      action = 'view_book';
      bookId = bookMatch[1];
      
      try {
        // Ambil judul buku
        const book = await db.book.findUnique({
          where: { id: bookId },
          select: { title: true }
        });
        bookTitle = book?.title;
      } catch (err) {
        console.error('Error fetching book:', err);
      }
    }
    
    // Simpan log dengan try-catch agar tidak mengganggu response
    try {
      await db.visitorLog.create({
        data: {
          action,
          bookId,
          bookTitle,
          ipAddress: ip,
          userAgent,
          sessionId: request.cookies.get('session-id')?.value || 'unknown',
          createdAt: new Date()
        }
      });
    } catch (err) {
      console.error('Error saving visitor log:', err);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}