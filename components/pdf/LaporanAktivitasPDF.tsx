// components/pdf/LaporanAktivitasPDF.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Styles untuk PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  date: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 4,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    padding: 6,
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    fontWeight: "bold",
  },
  colDate: { width: "25%", fontSize: 8, paddingRight: 4 },
  colUser: { width: "25%", fontSize: 8, paddingRight: 4 },
  colAction: { width: "20%", fontSize: 8, paddingRight: 4 },
  colContent: { width: "30%", fontSize: 8 },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 15,
  },
  statCard: {
    width: "33%",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

export default function LaporanAktivitasPDF({ data, stats, dateRange }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 Laporan Aktivitas Perpustakaan</Text>
          <Text style={styles.subtitle}>MUHPATHLIB Digital Library</Text>
          <Text style={styles.date}>
            Periode: {dateRange.start} - {dateRange.end} | Dicetak: {new Date().toLocaleDateString("id-ID")}
          </Text>
        </View>

        {/* Statistik Ringkasan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Ringkasan Aktivitas</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Aktivitas</Text>
              <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Membaca Buku</Text>
              <Text style={styles.statValue}>{stats.reads.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pencarian</Text>
              <Text style={styles.statValue}>{stats.searches.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>User Aktif</Text>
              <Text style={styles.statValue}>{stats.activeUsers.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Buku Diakses</Text>
              <Text style={styles.statValue}>{stats.booksAccessed.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Rata-rata/hari</Text>
              <Text style={styles.statValue}>{stats.averagePerDay.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Top Buku */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 Buku Paling Sering Diakses</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "10%", fontSize: 8 }}>#</Text>
              <Text style={{ width: "60%", fontSize: 8 }}>Judul Buku</Text>
              <Text style={{ width: "30%", fontSize: 8, textAlign: "right" }}>Jumlah</Text>
            </View>
            {stats.topBooks && stats.topBooks.length > 0 ? (
              stats.topBooks.map((book: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "10%", fontSize: 8 }}>{idx + 1}</Text>
                  <Text style={{ width: "60%", fontSize: 8 }}>{book.bookTitle || "-"}</Text>
                  <Text style={{ width: "30%", fontSize: 8, textAlign: "right" }}>{book._count.id} kali</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={{ width: "100%", fontSize: 8, textAlign: "center" }}>Belum ada data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabel Log Aktivitas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Detail Aktivitas (10 Terbaru)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Waktu</Text>
              <Text style={styles.colUser}>Pengguna</Text>
              <Text style={styles.colAction}>Aktivitas</Text>
              <Text style={styles.colContent}>Konten</Text>
            </View>
            {data && data.length > 0 ? (
              data.map((activity: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colDate}>
                    {new Date(activity.createdAt).toLocaleDateString("id-ID")}
                  </Text>
                  <Text style={styles.colUser}>{activity.userEmail || "Guest"}</Text>
                  <Text style={styles.colAction}>{activity.action}</Text>
                  <Text style={styles.colContent}>{activity.bookTitle || "-"}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={{ width: "100%", fontSize: 8, textAlign: "center" }}>Belum ada aktivitas</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Dokumen ini dibuat secara otomatis oleh sistem MUHPATHLIB</Text>
        </View>
      </Page>
    </Document>
  );
}