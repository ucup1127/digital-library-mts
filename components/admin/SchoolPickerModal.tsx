// components/admin/SchoolPickerModal.tsx
"use client";

import { useEffect, useState } from "react";

interface School {
  id: string;
  name: string;
  logo?: string;
}

interface SchoolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (schoolId: string, schoolName: string) => void;
}

export default function SchoolPickerModal({ isOpen, onClose, onSelect }: SchoolPickerModalProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
    }
  }, [isOpen]);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Pilih Sekolah</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            placeholder="Cari sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></div>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Tidak ada sekolah ditemukan
            </div>
          ) : (
            filteredSchools.map((school) => (
              <button
                key={school.id}
                onClick={() => {
                  onSelect(school.id, school.name);
                  onClose();
                }}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">
                  🏫
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{school.name}</p>
                  <p className="text-[8px] text-gray-400">ID: {school.id}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}