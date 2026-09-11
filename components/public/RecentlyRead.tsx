// components/public/RecentlyRead.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";

interface RecentlyReadBook {
  id: string;
  title: string;
  coverUrl: string | null;
}

export default function RecentlyRead() {
  const [recentBooks, setRecentBooks] = useState<RecentlyReadBook[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recently_read");
    if (stored) {
      try {
        const books = JSON.parse(stored);
        setRecentBooks(books.slice(0, 10));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (recentBooks.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          Baru Dibaca
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem("recently_read");
            setRecentBooks([]);
          }}
          className="text-[9px] text-gray-400 hover:text-red-500 transition flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Hapus
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {recentBooks.map((book) => (
          <Link
            key={book.id}
            href={`/buku/${book.id}`}
            className="shrink-0 w-16 group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 p-1 text-center bg-gray-50">
                  {book.title.slice(0, 10)}
                </div>
              )}
            </div>
            <p className="text-[8px] text-gray-500 truncate text-center mt-1 group-hover:text-blue-600 transition">
              {book.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}