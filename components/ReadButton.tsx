"use client"
import { useState, useEffect } from "react";
import { createVisitor } from "../actions/visitor";

export default function ReadButton({ pdfUrl }: { pdfUrl: string }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");

  const handleReadClick = () => {
    const isRegistered = localStorage.getItem("visitor_name");
    if (isRegistered) {
      window.open(pdfUrl, "_blank"); // Langsung buka PDF jika sudah pernah isi
    } else {
      setShowModal(true); // Munculkan modal jika belum
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (name && school) {
    // 1. Simpan ke Database
    const result = await createVisitor(name, school);
    
    if (result.success) {
      // 2. Simpan di browser agar tidak muncul lagi
      localStorage.setItem("visitor_name", name);
      setShowModal(false);
      window.open(pdfUrl, "_blank");
    } else {
      alert("Gagal mencatat kunjungan, silakan coba lagi.");
    }
  }
};

  return (
    <>
      <button 
        onClick={handleReadClick}
        className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-blue-200"
      >
        Baca Buku Sekarang (PDF)
      </button>

      {/* Modal Minimalis */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Buku Tamu</h2>
            <p className="text-gray-500 mb-6">Sapa kami dulu sebelum mulai membaca ya!</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nama Lengkap" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Asal Sekolah / Instansi" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setSchool(e.target.value)}
                required
              />
              <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-blue-600 transition">
                Konfirmasi & Baca
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}