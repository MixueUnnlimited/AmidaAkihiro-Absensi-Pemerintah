import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [pegawai, setPegawai] = useState([]);
  const [absensi, setAbsensi] = useState([]);

  // =========================
  // WIB DATE (STABLE FIX)
  // =========================
  const getWIBDate = () => {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().split("T")[0];
  };

  // =========================
  // ACCESS CHECK
  // =========================
  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      window.location.href = "/";
      return;
    }

    const { data: roleData } = await supabase
      .from("pegawai")
      .select("role")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      alert("Kamu bukan admin!");
      window.location.href = "/dashboard";
      return;
    }

    await loadData();
    setLoading(false);
  };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
  };

  // =========================
  // REALTIME (SAFE VERSION)
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel("absensi-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi",
        },
        (payload) => {
          console.log("REALTIME:", payload);

          // ❗ prevent spam reload
          setTimeout(() => {
            loadData();
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // LOAD DATA (FIXED CLEAN)
  // =========================
  const loadData = async () => {
    const today = getWIBDate();

    // reset dulu biar tidak “ketumpuk UI”
    setAbsensi([]);

    const { data: pegawaiData } = await supabase
      .from("pegawai")
      .select("*");

    const { data: absensiData } = await supabase
      .from("absensi")
      .select("*")
      .order("tanggal", { ascending: false });

    const merged = (absensiData || []).map((a) => {
      const peg = pegawaiData?.find((p) => p.id === a.pegawai_id);

      return {
        ...a,
        nama: peg?.nama || "Tidak ditemukan",
        jabatan: peg?.jabatan || "-",
      };
    });

    setPegawai(pegawaiData || []);
    setAbsensi(merged);
  };

  // =========================
  // STATUS
  // =========================
  const getStatus = (jamMasuk) => {
    if (!jamMasuk) return "Alpha";

    const jam = new Date(jamMasuk).getHours();
    return jam <= 8 ? "Hadir" : "Telat";
  };

  // =========================
  // UI
  // =========================
  if (loading) return <h2>Checking access...</h2>;

  const headerStyle = {
  backgroundColor: "#1e3a5f",
  color: "white",
  padding: "12px",
  textAlign: "left",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

  return (
  <div
    style={{
      minHeight: "100vh",
      backgroundColor: "#f4f6f9",
      padding: "30px",
    }}
  >
    <div
      style={{
        backgroundColor: "#1e3a5f",
        color: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ margin: 0 }}>Admin Dashboard</h1>

      <button
        onClick={handleLogout}
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Logout
      </button>
    </div>

    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>Nama</th>
            <th style={headerStyle}>Jabatan</th>
            <th style={headerStyle}>Tanggal</th>
            <th style={headerStyle}>Jam Masuk</th>
            <th style={headerStyle}>Jam Pulang</th>
            <th style={headerStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {absensi.length > 0 ? (
            absensi.map((a) => (
              <tr key={a.id}>
                <td style={cellStyle}>{a.nama}</td>
                <td style={cellStyle}>{a.jabatan}</td>
                <td style={cellStyle}>{a.tanggal}</td>

                <td style={cellStyle}>
                  {a.jam_masuk
                    ? new Date(a.jam_masuk).toLocaleTimeString("id-ID")
                    : "-"}
                </td>

                <td style={cellStyle}>
                  {a.jam_pulang
                    ? new Date(a.jam_pulang).toLocaleTimeString("id-ID")
                    : "-"}
                </td>

                <td style={cellStyle}>{getStatus(a.jam_masuk)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={cellStyle} colSpan="6">
                Belum ada data absensi
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
}