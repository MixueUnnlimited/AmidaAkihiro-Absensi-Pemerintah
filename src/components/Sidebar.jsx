export default function Sidebar({ menu, setMenu }) {
  return (
    <aside className="sidebar">

      <div className="logo">
        <h2>ABSENSI</h2>
        <span>Pemerintah</span>
      </div>

      <nav>

        <button
          className={menu === "dashboard" ? "active" : ""}
          onClick={() => setMenu("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          className={menu === "absensi" ? "active" : ""}
          onClick={() => setMenu("absensi")}
        >
          📝 Absensi
        </button>

        <button
          className={menu === "pegawai" ? "active" : ""}
          onClick={() => setMenu("pegawai")}
        >
          👥 Pegawai
        </button>

        <button
          className={menu === "laporan" ? "active" : ""}
          onClick={() => setMenu("laporan")}
        >
          📄 Laporan
        </button>

        <button
          className={menu === "pengaturan" ? "active" : ""}
          onClick={() => setMenu("pengaturan")}
        >
          ⚙ Pengaturan
        </button>

      </nav>

    </aside>
  );
}