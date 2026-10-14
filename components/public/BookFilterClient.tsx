// components/public/BookFilterClient.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BookFilterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  if (!searchQuery) return null;

  return (
    <button
      type="button"
      onClick={clearSearch}
      className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
      aria-label="Hapus pencarian"
    >
      <X className="w-4 h-4" />
    </button>
  );
}