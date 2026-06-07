import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { supabase } from "../services/supabase";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import Pegawai from "./Pegawai";

import "../styles/dashboard.css";

// format WIB
const formatWIB = (utcString) =>
  new Date(utcString).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

export default function Dashboard() {
  const [menu, setMenu] = useState("dashboard");

  const [pegawai, setPegawai] = useState(null);
  const [namaEdit, setNamaEdit] = useState("");
  const [jabatanEdit, setJabatanEdit] = useState("");
  const [absensi, setAbsensi] = useState([]);
  const [laporan, setLaporan] = useState([]);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  const [totalPegawai, setTotalPegawai] = useState(0);
  const [pegawaiAktif, setPegawaiAktif] = useState(0);
  const [pegawaiNonaktif, setPegawaiNonaktif] = useState(0);

  useEffect(() => {
    loadPegawai();
    loadAbsensi();
    loadStatistikPegawai();
    loadLaporan();
  }, []);

  useEffect(() => {
  const channel = supabase
    .channel("laporan-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "absensi",
      },
      (payload) => {
        console.log("LAPORAN REALTIME:", payload);

        setTimeout(() => {
          loadLaporan();
          loadAbsensi(); // sekalian update menu Absensi
        }, 300);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const simpanProfil = async () => {
  if (!pegawai) return;

  console.log("PEGAWAI:", pegawai);
  console.log("ID PEGAWAI:", pegawai.id);

  const { data, error } = await supabase
    .from("pegawai")
    .update({
      nama: namaEdit,
      jabatan: jabatanEdit,
    })
    .eq("id", pegawai.id)
    .select();

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    alert("Gagal menyimpan data");
    return;
  }

  alert("Profil berhasil diperbarui");

  loadPegawai();
};

  const loadStatistikPegawai = async () => {
    const { data, error } = await supabase.from("pegawai").select("*");
    if (error) {
      console.log(error.message);
      return;
    }

    setTotalPegawai(data.length);
    setPegawaiAktif(data.filter((p) => (p.status || "Aktif") === "Aktif").length);
    setPegawaiNonaktif(data.filter((p) => p.status === "Nonaktif").length);
  };

  const loadLaporan = async () => {
    const { data, error } = await supabase
      .from("absensi")
      .select(
        `
          *,
          pegawai (nama)
        `
      )
      .order("tanggal", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setLaporan(data || []);
  };

  const loadPegawai = async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return;

  const { data } = await supabase
    .from("pegawai")
    .select("*")
    .eq("user_id", auth.user.id);

  if (data?.length) {
    setPegawai(data[0]);

    setNamaEdit(data[0].nama || "");
    setJabatanEdit(data[0].jabatan || "");
  }
};

  const loadAbsensi = async () => {
    const { data, error } = await supabase
      .from("absensi")
      .select(`
            *,
            pegawai (
            nama
        )
      `)
      .order("tanggal", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setAbsensi(data || []);
  };

  const handleAbsenMasuk = async () => {
    if (!pegawai) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: cek } = await supabase
      .from("absensi")
      .select("*")
      .eq("pegawai_id", pegawai.id)
      .eq("tanggal", today);

    if (cek?.length) {
      alert("Sudah absen hari ini!");
      return;
    }

    await supabase.from("absensi").insert({
      pegawai_id: pegawai.id,
      tanggal: today,
      jam_masuk: new Date().toISOString(),
      status: "Hadir",
    });

    alert("Absen masuk berhasil!");
    loadAbsensi();
  };

  const handleAbsenPulang = async () => {
    if (!pegawai) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("absensi")
      .select("*")
      .eq("pegawai_id", pegawai.id)
      .eq("tanggal", today);

    if (!data?.length) {
      alert("Belum absen masuk!");
      return;
    }

    const absen = data[0];
    if (absen.jam_pulang) {
      alert("Sudah absen pulang!");
      return;
    }

    await supabase
      .from("absensi")
      .update({ jam_pulang: new Date().toISOString() })
      .eq("id", absen.id);

    alert("Absen pulang berhasil!");
    loadAbsensi();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const laporanFiltered = laporan.filter((item) => {
    if (!tanggalAwal && !tanggalAkhir) return true;
    if (tanggalAwal && item.tanggal < tanggalAwal) return false;
    if (tanggalAkhir && item.tanggal > tanggalAkhir) return false;
    return true;
  });

  const exportExcel = () => {
    const dataExport = laporanFiltered.map((item) => ({
      Tanggal: item.tanggal,
      Nama: item.pegawai?.nama || "-",
      "Jam Masuk": item.jam_masuk ? formatWIB(item.jam_masuk) : "-",
      "Jam Pulang": item.jam_pulang ? formatWIB(item.jam_pulang) : "-",
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "Laporan_Absensi.xlsx");
  };

  if (!pegawai) return <h2>Loading...</h2>;

  return (
    <div className="dashboard-layout">
      <Sidebar menu={menu} setMenu={setMenu} />

      <main className="main-content">
        <Header pegawai={pegawai} />

        {menu === "dashboard" && (
          <>
            <div className="cards">
              <StatCard title="Total Pegawai" value={totalPegawai} />
              <StatCard title="Pegawai Aktif" value={pegawaiAktif} />
              <StatCard title="Pegawai Nonaktif" value={pegawaiNonaktif} />
            </div>

            <div className="action-box">
              <h2>Absensi Hari Ini</h2>

              <div className="action-buttons">
                <button className="absen-masuk" onClick={handleAbsenMasuk}>
                  Absen Masuk
                </button>

                <button className="absen-pulang" onClick={handleAbsenPulang}>
                  Absen Pulang
                </button>

                <button className="logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </>
        )}

        {menu === "absensi" && (
          <div className="absensi-table-wrapper">
            <h2>Riwayat Absensi</h2>

            <table className="absensi-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Pegawai</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {absensi.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tanggal}</td>
                    <td>{item.pegawai?.nama || "-"}</td>
                    <td>{item.jam_masuk ? formatWIB(item.jam_masuk) : "-"}</td>
                    <td>{item.jam_pulang ? formatWIB(item.jam_pulang) : "-"}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {menu === "pegawai" && <Pegawai />}

        {menu === "laporan" && (
          <div className="absensi-table-wrapper">
            <h2>Laporan Absensi</h2>

            <div style={{
  display: "flex",
  gap: "15px",
  alignItems: "flex-end",
  marginBottom: "20px",
  flexWrap: "wrap"
}}>

  <div>
    <label style={{ display: "block", marginBottom: "5px" }}>
      Dari Tanggal
    </label>
    <input
      type="date"
      value={tanggalAwal}
      onChange={(e) => setTanggalAwal(e.target.value)}
    />
  </div>

  <div>
    <label style={{ display: "block", marginBottom: "5px" }}>
      Sampai Tanggal
    </label>
    <input
      type="date"
      value={tanggalAkhir}
      onChange={(e) => setTanggalAkhir(e.target.value)}
    />
  </div>

  <button
    onClick={exportExcel}
    style={{
      height: "40px",
      padding: "0 15px",
      cursor: "pointer",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "8px"
    }}
  >
    Export Excel
  </button>

</div>

            <table className="absensi-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Pegawai</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {laporanFiltered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tanggal}</td>
                    <td>{item.pegawai?.nama || "-"}</td>
                    <td>{item.jam_masuk ? formatWIB(item.jam_masuk) : "-"}</td>
                    <td>{item.jam_pulang ? formatWIB(item.jam_pulang) : "-"}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {menu === "pengaturan" && (
  <div className="settings-wrapper">

    <h2>⚙️ Pengaturan Akun</h2>

    <div className="settings-field">
      <label>Nama Pegawai</label>
      <input
        type="text"
        value={namaEdit}
        onChange={(e) => setNamaEdit(e.target.value)}
      />
    </div>

    <div className="settings-field">
      <label>Jabatan</label>
      <input
        type="text"
        value={jabatanEdit}
        onChange={(e) => setJabatanEdit(e.target.value)}
      />
    </div>

    <div className="settings-field">
      <label>Status</label>
      <div className="settings-status">
        {pegawai?.status || "Aktif"}
      </div>
    </div>

    <div className="settings-actions">
      <button className="settings-save" onClick={simpanProfil}>
        Simpan Perubahan
      </button>

      <button className="settings-logout" onClick={handleLogout}>
        Logout
      </button>
    </div>

  </div>
)}
      </main>
    </div>
  );
}

