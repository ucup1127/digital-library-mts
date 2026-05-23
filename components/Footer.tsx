// components/Footer.tsx

export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-50 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-4">
        {/* Logo Tipis Sebagai Pemanis */}
        <div className="text-gray-200 font-black italic uppercase text-xs tracking-[0.5em]">
          MUHPATH.
        </div>
        
        {/* Teks Copyright Utama */}
        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center leading-relaxed">
          © 2026 MTs Muhammadiyah Patikraja. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}