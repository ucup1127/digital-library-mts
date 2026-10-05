// app/(public)/buku/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DetailBukuClient from "./DetailBukuClient";

export default async function DetailBukuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const book = await db.book.findUnique({
    where: { id },
    include: {
      categories: {
        include: { category: true },
      },
      school: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!book) {
    notFound();
  }

  // 🔥 Cek akses buku
  const session = await getSession();
  const userSchoolId = session?.schoolId;

  // Buku eksklusif (isShared = false) — cuma bisa diakses sekolah owner
  if (!book.isShared) {
    if (!userSchoolId || userSchoolId !== book.schoolId) {
      // Bukan sekolah owner → redirect ke home
      redirect("/");
    }
  }

  const formattedBook = {
    ...book,
    category: book.categories[0]?.category || null,
  };

  return <DetailBukuClient book={formattedBook} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;