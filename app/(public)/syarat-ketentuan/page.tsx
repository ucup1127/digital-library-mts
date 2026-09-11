// app/(public)/syarat-ketentuan/page.tsx
"use client";

import Link from "next/link";

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Syarat & Ketentuan</h1>
          <p className="text-gray-500 text-sm mt-2">Perpustakaan Digital MTs Muhammadiyah Patikraja</p>
          <div className="w-16 h-0.5 bg-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Keanggotaan</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Layanan perpustakaan digital hanya diperuntukkan bagi siswa dan guru aktif di MTs Muhammadiyah 
              Patikraja. Setiap anggota bertanggung jawab penuh atas akun masing-masing.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Aturan Peminjaman Buku Fisik</h2>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
              <li>Maksimal 2 buku per orang</li>
              <li>Durasi pinjam 7 hari</li>
              <li>Denda keterlambatan Rp1.000/hari per buku</li>
              <li>Buku rusak/hilang wajib diganti dengan yang sama</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Buku Digital</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Buku digital dapat dibaca online. Unduhan hanya untuk keperluan pribadi dan tidak boleh 
              disebarluaskan. Melanggar aturan ini dapat dikenakan sanksi penonaktifan akun.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Sanksi Pelanggaran</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pelanggaran terhadap aturan dapat dikenakan sanksi berupa peringatan, penangguhan akses, 
              hingga pemblokiran permanen. Keputusan petugas perpustakaan bersifat mutlak.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Perubahan Aturan</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Perpustakaan berhak mengubah syarat dan ketentuan sewaktu-waktu. Perubahan akan diinformasikan 
              melalui website atau pengumuman di perpustakaan.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <p className="text-gray-500 text-xs text-center">
              Berlaku sejak: 1 Januari 2025
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 text-sm hover:underline">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}