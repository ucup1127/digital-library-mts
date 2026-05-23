// components/ui/PrintButton.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface PrintButtonProps {
  title?: string;
  data?: any[];
  columns?: { header: string; accessor: string }[];
  onPrint?: () => void;
}

export default function PrintButton({ title = "Laporan", data = [], columns = [], onPrint }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    setLoading(true);
    
    try {
      // Jika ada fungsi custom
      if (onPrint) {
        onPrint();
        setLoading(false);
        return;
      }
      
      // Buat konten untuk print
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #1e3a8a;
              margin-bottom: 10px;
            }
            .subtitle {
              text-align: center;
              color: #6b7280;
              margin-bottom: 30px;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f3f4f6;
              padding: 10px;
              text-align: left;
              font-size: 12px;
              font-weight: bold;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #9ca3af;
            }
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="subtitle">
            Dicetak: ${new Date().toLocaleString('id-ID')}
          </div>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => `<td>${row[col.accessor] || '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Laporan ini dibuat secara otomatis oleh sistem<br />
            © ${new Date().getFullYear()} MUHPATHLIB - Perpustakaan Digital
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        toast.error("Popup diblokir. Izinkan popup untuk mencetak.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Gagal mencetak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? "⏳" : "🖨️"} Print
    </button>
  );
}