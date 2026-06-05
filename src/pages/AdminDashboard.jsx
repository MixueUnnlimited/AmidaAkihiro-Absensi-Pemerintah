import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState([]);

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

    // ❌ kalau bukan admin → tendang
    if (!roleData || roleData.role !== "admin") {
      alert("Kamu bukan admin!");
      window.location.href = "/dashboard";
      return;
    }

    loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data } = await supabase
      .from("absensi")
      .select("*")
      .order("tanggal", { ascending: false });

    setData(data || []);
  };

  if (loading) return <h2>Checking access...</h2>;

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <table border="1">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.tanggal}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}