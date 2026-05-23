// app/admin-test/page.tsx
export default function AdminTest() {
  return (
    <div style={{ 
      padding: "40px", 
      backgroundColor: "white", 
      minHeight: "100vh",
      position: "relative",
      zIndex: 999999
    }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "black" }}>TEST PAGE</h1>
      <p style={{ marginTop: "16px", color: "gray" }}>Jika halaman ini muncul dan bisa diklik, berarti masalahnya di layout admin.</p>
      
      <button 
        onClick={() => alert("Button bisa diklik!")}
        style={{ 
          marginTop: "24px", 
          padding: "12px 24px", 
          backgroundColor: "blue", 
          color: "white", 
          borderRadius: "8px",
          cursor: "pointer",
          border: "none"
        }}
      >
        Test Click
      </button>
      
      <div style={{ marginTop: "32px", padding: "16px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
        <p style={{ color: "black" }}>
          ✅ Jika tombol di atas BISA diklik, berarti tidak ada overlay global.
          <br />
          ❌ Jika TIDAK BISA diklik, berarti ada overlay dari luar (mungkin dari browser extension atau CSS global yang aneh).
        </p>
      </div>
    </div>
  );
}