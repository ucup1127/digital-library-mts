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
  const itemsPerPage = 12;

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

  const totalBooks = await db.book.count({ where });
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

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
    <div className="bg-gray-50 min-h-screen pb-12 pt-10">

      {/* ============================================= */}
      {/* 🔥 SEARCH & FILTER */}
      {/* ============================================= */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <BookFilter categories={categories} />
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 CATEGORY FILTER */}
      {/* ============================================= */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
             Kategori
          </h2>
          <span className="text-[9px] text-gray-400">
            {totalBooks} buku
          </span>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          <Link 
            href={`/?${searchQuery ? `q=${searchQuery}` : ""}`}
            className={`flex-none px-4 py-1.5 rounded-full border text-[10px] font-medium transition-all ${
              !categoryId 
                ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/?category=${cat.id}&page=1${searchQuery ? `&q=${searchQuery}` : ""}`}
              className={`flex-none px-4 py-1.5 rounded-full border text-[10px] font-medium transition-all whitespace-nowrap ${
                categoryId === cat.id 
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 RECENTLY READ */}
      {/* ============================================= */}
      <RecentlyRead />

      {/* ============================================= */}
      {/* 🔥 BOOK GRID */}
      {/* ============================================= */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            Koleksi Buku
          </h2>
          {books.length > 0 && (
            <span className="text-[9px] text-gray-400">
              {books.length} dari {totalBooks} buku
            </span>
          )}
        </div>

        {books.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-gray-400 text-sm">Buku tidak ditemukan</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {books.map((book) => (
                <Link href={`/buku/${book.id}`} key={book.id} className="group">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-[10px] font-medium p-3 text-center">
                        {book.title}
                      </div>
                    )}
                    {book.categories[0]?.category && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[6px] font-medium px-2 py-0.5 rounded-full">
                        {book.categories[0].category.name}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-[10px] sm:text-xs mt-1.5 line-clamp-1 group-hover:text-blue-600 transition">
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
              <div className="mt-8">
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