// app/(public)/baca/[id]/page.tsx
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import SaveHistory from "@/components/public/SaveHistory"; // Import komponen baru

export default async function BacaBukuPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  const book = await db.book.findFirst({
    where: { id: bookId },
  });

  if (!book || !book.fileUrl) return notFound();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* HEADER: Navigasi Minimalis */}
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-start py-3 px-4 z-50 pointer-events-none">
        <Link 
          href={`/katalog/${book.id}`} 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 pointer-events-auto active:scale-90 transition-all border border-white/10"
        >
          <span className="text-sm font-light">✕</span>
        </Link>

        <div className="text-right mt-1 opacity-30">
          <h1 className="text-[7px] font-black text-white uppercase italic tracking-[0.2em] leading-none">
            {book.title}
          </h1>
        </div>
      </nav>

      {/* VIEWER: PDF Full Screen */}
      <div className="flex-1 w-full h-full bg-black">
        <iframe 
          src={`${book.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`} 
          className="w-full h-full border-none shadow-2xl"
          style={{ height: '100vh' }}
          title={book.title}
        />
      </div>

      {/* FOOTER WATERMARK */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-20">
        <p className="text-[7px] font-black text-white uppercase tracking-[1em] italic">
          MUHPATH
        </p>
      </div>

      {/* GANTI SCRIPT LAMA DENGAN INI: Komponen Klien untuk simpan history */}
      <SaveHistory book={book} />
    </div>
  );
}