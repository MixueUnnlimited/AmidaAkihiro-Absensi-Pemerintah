import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nip, setNip] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    setLoading(true);

    try {
      // Register ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      console.log("User:", user);

      // Simpan ke tabel pegawai
      const { error: pegawaiError } =
        await supabase.from("pegawai").insert({
          user_id: user.id,
          nama,
          email,
          nip,
          jabatan,
          role: "pegawai",
        });

      if (pegawaiError) {
  console.error("Pegawai Error:", pegawaiError);

  alert(
    JSON.stringify(pegawaiError, null, 2)
  );

  setLoading(false);
  return;
}

      alert("Registrasi berhasil!");

      navigate("/");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Registrasi Pegawai</h1>

      <form onSubmit={handleRegister}>
        <br />

        <input
          type="text"
          placeholder="Nama Lengkap"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="text"
          placeholder="NIP"
          value={nip}
          onChange={(e) => setNip(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="text"
          placeholder="Jabatan"
          value={jabatan}
          onChange={(e) => setJabatan(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <br /><br />

        <button type="submit">
          {loading
            ? "Memproses..."
            : "Daftar"}
        </button>
      </form>
    </div>
  );
}