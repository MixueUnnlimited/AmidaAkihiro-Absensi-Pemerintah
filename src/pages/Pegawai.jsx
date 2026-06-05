import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Pegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  // form state
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const handleEditStart = (p) => {
    setEditId(p.id);
    setNama(p.nama);
    setJabatan(p.jabatan);
    setStatus(p.status || "Aktif");
  };

  useEffect(() => {
    loadPegawai();
  }, []);

  const loadPegawai = async () => {
    const { data, error } = await supabase
      .from("pegawai")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setPegawai(data || []);
    setLoading(false);
  };

  // =====================
  // TAMBAH / UPDATE PEGAWAI
  // =====================
  const handleUpdatePegawai = async () => {
    if (!editId) return;

    const handleDeletePegawai = async (id) => {
  const konfirmasi = window.confirm(
    "Yakin ingin menghapus pegawai ini?"
  );

  if (!konfirmasi) return;

  const { error } = await supabase
    .from("pegawai")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Pegawai berhasil dihapus!");

  loadPegawai();
};

    const { error } = await supabase
      .from("pegawai")
      .update({
        nama,
        jabatan,
        status,
      })
      .eq("id", editId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pegawai berhasil diupdate!");

    // reset
    setEditId(null);
    setNama("");
    setJabatan("");
    setStatus("Aktif");

    loadPegawai();
  };

  const handleAddPegawai = async (e) => {
    e.preventDefault();

    if (!nama || !jabatan) {
      alert("Nama dan Jabatan wajib diisi!");
      return;
    }

    const { error } = await supabase.from("pegawai").insert({
      nama,
      jabatan,
      status,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pegawai berhasil ditambahkan!");

    // reset form
    setNama("");
    setJabatan("");
    setStatus("Aktif");

    loadPegawai();
  };

  if (loading) return <h2>Loading Pegawai...</h2>;

  const filteredPegawai = pegawai.filter((p) => {
  const cocokNama = p.nama
    .toLowerCase()
    .includes(search.toLowerCase());

  const cocokStatus =
    filterStatus === "Semua" ||
    (p.status || "Aktif") === filterStatus;

  return cocokNama && cocokStatus;
});

  return (
    <div className="pegawai-page">

      <h2>👥 Halaman Pegawai</h2>

    <input
          type="text"
          placeholder="🔍 Cari Pegawai..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
      />
    <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
     >
        <option value="Semua">Semua Status</option>
        <option value="Aktif">Aktif</option>
        <option value="Nonaktif">Nonaktif</option>
    </select>

      {/* ================= FORM ================= */}
      <form className="pegawai-form" onSubmit={handleAddPegawai}>

        <input
          type="text"
          placeholder="Nama Pegawai"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />

        <input
          type="text"
          placeholder="Jabatan"
          value={jabatan}
          onChange={(e) => setJabatan(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>

        {editId ? (
          <button type="button" onClick={handleUpdatePegawai}>
            Update Pegawai
          </button>
        ) : (
          <button type="submit">
            + Tambah Pegawai
          </button>
        )}

        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setNama("");
              setJabatan("");
              setStatus("Aktif");
            }}
          >
            Cancel
          </button>
        )}

      </form>

      {/* ================= TABLE ================= */}
      <table className="pegawai-table">

        <thead>
          <tr>
            <th>Nama</th>
            <th>Jabatan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {pegawai.length > 0 ? (
            filteredPegawai.map((p) => (
              <tr key={p.id}>
                <td>{p.nama}</td>
                <td>{p.jabatan}</td>
                <td>{p.status || "Aktif"}</td>

                {/* ⭐ TAMBAHAN EDIT BUTTON */}
                <td>
                  <button onClick={() => handleEditStart(p)}>
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePegawai(p.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Belum ada data pegawai</td>
            </tr>
          )}
        </tbody>

      </table>

    </div>
  );
}