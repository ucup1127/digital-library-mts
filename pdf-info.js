// pdf-info.js
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

async function main() {
  const path = "pdf-compress-test/original.pdf";
  const bytes = fs.readFileSync(path);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const pageCount = pdf.getPageCount();
  const totalMB = bytes.length / 1024 / 1024;
  const perPageKB = bytes.length / pageCount / 1024;

  console.log("📄 File:", path);
  console.log("📦 Ukuran total:", totalMB.toFixed(2), "MB");
  console.log("📑 Jumlah halaman:", pageCount);
  console.log("📊 Ukuran per halaman:", perPageKB.toFixed(2), "KB");
  console.log("");

  // Analisis penyebab
  if (perPageKB > 500) {
    console.log("🔴 Kemungkinan besar: GAMBAR (foto/scan)");
    console.log("   Compress gambar harusnya sangat efektif.");
  } else if (perPageKB > 200) {
    console.log("🟡 Kemungkinan: campuran gambar + vektor");
  } else if (perPageKB > 100) {
    console.log("🟡 Kemungkinan: vektor + font");
  } else {
    console.log("🟢 Kemungkinan: teks + font, vektor minimal");
    console.log("   Compress gambar NGGAK akan banyak ngefek.");
  }
}

main().catch(console.error);