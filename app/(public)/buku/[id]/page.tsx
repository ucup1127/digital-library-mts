// app/(public)/buku/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import DetailBukuClient from "./DetailBukuClient";

export default async function DetailBukuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const book = await db.book.findUnique({
    where: { id },
    include: {
      categories: {
        include: { category: true }
      }
    }
  });
  
  if (!book) {
    notFound();
  }
  
  const formattedBook = {
    ...book,
    category: book.categories[0]?.category || null
  };
  
  return <DetailBukuClient book={formattedBook} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;