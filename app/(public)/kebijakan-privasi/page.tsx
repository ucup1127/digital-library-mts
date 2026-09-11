// app/(public)/kebijakan-privasi/page.tsx
"use client";

import Link from "next/link";

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Kebijakan Privasi</h1>
          <p className="text-gray-500 text-sm mt-2">Perpustakaan Digital MTs Muhammadiyah Patikraja</p>
          <div className="w-16 h-0.5 bg-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Data yang Kami Kumpulkan</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Saat Anda menggunakan layanan perpustakaan digital, kami mengumpulkan informasi seperti nama, 
              email, kelas, nomor anggota, serta riwayat peminjaman dan bacaan Anda. Data ini diperlukan 
              untuk mengidentifikasi anggota dan memproses transaksi perpustakaan.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Bagaimana Data Digunakan</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Informasi yang kami kumpulkan hanya digunakan untuk keperluan internal perpustakaan, seperti 
              memproses peminjaman buku, mengirim notifikasi jatuh tempo, dan meningkatkan layanan. 
              Kami tidak pernah menjual atau membagikan data Anda kepada pihak ketiga.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Keamanan Data</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Data Anda disimpan dengan sistem keamanan berlapis. Hanya petugas perpustakaan yang berwenang 
              yang dapat mengakses data tersebut. Kami juga rutin melakukan backup untuk mencegah kehilangan data.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Hapus Akun</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Jika Anda adalah siswa atau guru yang sudah tidak aktif, Anda dapat meminta penghapusan akun 
              kepada petugas perpustakaan. Data riwayat peminjaman akan tetap tersimpan sebagai arsip internal.
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