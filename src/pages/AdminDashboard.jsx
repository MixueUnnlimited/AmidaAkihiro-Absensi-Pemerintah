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
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
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

  return (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}
    >
      <h1>Admin Dashboard</h1>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>

      <table border="1">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Jabatan</th>
            <th>Tanggal</th>
            <th>Jam Masuk</th>
            <th>Jam Pulang</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {absensi.length > 0 ? (
            absensi.map((a) => (
              <tr key={a.id}>
                <td>{a.nama}</td>
                <td>{a.jabatan}</td>
                <td>{a.tanggal}</td>
                <td>
                  {a.jam_masuk
                    ? new Date(a.jam_masuk).toLocaleTimeString("id-ID")
                    : "-"}
                </td>
                <td>
                  {a.jam_pulang
                    ? new Date(a.jam_pulang).toLocaleTimeString("id-ID")
                    : "-"}
                </td>
                <td>{getStatus(a.jam_masuk)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">Belum ada absensi hari ini</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}