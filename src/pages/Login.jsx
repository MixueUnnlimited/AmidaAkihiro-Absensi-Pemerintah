import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // ambil user login
    const { data: { user } } = await supabase.auth.getUser();

    // cari data pegawai
    const { data: pegawai, error: pegawaiError } = await supabase
      .from("pegawai")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (pegawaiError || !pegawai) {
      setError("Data pegawai tidak ditemukan");
      setLoading(false);
      return;
    }

    // redirect berdasarkan role
    if (pegawai.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1>Sistem Absensi Pemerintah</h1>
          <p>Silakan masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="login-btn">
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="register-link">
          Belum punya akun?
          <span onClick={() => navigate("/register")}>
            Daftar
          </span>
        </div>

      </div>
    </div>
  );
}