// app/(public)/page.tsx
import { db } from "@/lib/db";
import Link from "next/link";
import BookFilter from "@/components/public/BookFilter";
import RecentlyRead from "@/components/public/RecentlyRead";
import Pagination from "@/components/public/Pagination";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const categoryId = params.category;
  const searchQuery = params.q;
  const currentPage = parseInt(params.page || "1");
  const itemsPerPage = 12; // 12 buku per halaman

  const categories = await db.category.findMany() || [];

  const where: any = {};
  if (categoryId) {
    where.categories = {
      some: { categoryId: categoryId }
    };
  }
  
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { author: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Hitung total buku untuk pagination
  const totalBooks = await db.book.count({ where });
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

  // Ambil buku dengan pagination
  const books = await db.book.findMany({
    where,
    include: {
      categories: {
        include: { category: true }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  }) || [];

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-3 pb-2 text-center">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest">
          Selamat Datang di Perpustakaan Digital
        </p>
        <div className="w-12 h-0.5 bg-blue-600 mx-auto mt-1 rounded-full" />
      </div>

      {/* Search + Filter */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <BookFilter categories={categories} />
      </div>

      {/* Filter Kategori (Pill) */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar justify-start lg:justify-center">
          <Link 
            href={`/?${searchQuery ? `q=${searchQuery}` : ""}`}
            className={`flex-none px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
              !categoryId 
                ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"
            }`}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/?category=${cat.id}&page=1${searchQuery ? `&q=${searchQuery}` : ""}`}
              className={`flex-none px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
                categoryId === cat.id 
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <RecentlyRead />

      {/* Grid Buku */}
      <div className="max-w-7xl mx-auto px-6">
        {books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">Buku tidak ditemukan</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {books.map((book) => (
                <Link href={`/buku/${book.id}`} key={book.id} className="group">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[8px] font-bold p-2 text-center">
                        {book.title}
                      </div>
                    )}
                    {book.categories[0]?.category && (
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[6px] font-bold px-1.5 py-0.5 rounded-full">
                        {book.categories[0].category.name}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-[10px] md:text-xs mt-1.5 line-clamp-1 group-hover:text-blue-600 transition">
                    {book.title}
                  </h3>
                  <p className="text-[8px] text-gray-400 truncate">
                    {book.author}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={`/?${categoryId ? `category=${categoryId}&` : ""}${searchQuery ? `q=${searchQuery}&` : ""}`}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}