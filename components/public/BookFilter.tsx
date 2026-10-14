// components/public/BookFilter.tsx
import { Search } from "lucide-react";

export default function BookFilter({
  categories,
  defaultQuery = "",
}: {
  categories: any[];
  defaultQuery?: string;
}) {
  return (
    <form action="/" method="GET" className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          name="q"
          placeholder="Cari judul buku, penulis, atau kategori..."
          defaultValue={defaultQuery}
          className="w-full px-11 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Cari
        </button>
      </div>
    </form>
  );
}