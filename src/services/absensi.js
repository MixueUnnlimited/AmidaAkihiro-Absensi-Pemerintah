import { supabase } from "../services/supabase";

// WIB FIX
const getWIB = () => {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  return {
    tanggal: wib.toISOString().split("T")[0],
    jam: wib.toISOString(),
  };
};

// ABSEN MASUK
export const absenMasuk = async (pegawaiId) => {
  const { tanggal, jam } = getWIB();

  // cek sesi aktif
  const { data } = await supabase
    .from("absensi")
    .select("*")
    .eq("pegawai_id", pegawaiId)
    .is("jam_pulang", null);

  // ❗ FIX: pakai length
  if (data.length > 0) {
    throw new Error("Masih ada sesi yang belum pulang");
  }

  const { error } = await supabase.from("absensi").insert([
    {
      pegawai_id: pegawaiId,
      tanggal,
      jam_masuk: jam,
    },
  ]);

  if (error) throw error;
};

// ABSEN PULANG
export const absenPulang = async (pegawaiId) => {
  const { tanggal, jam } = getWIB();

  const { data } = await supabase
    .from("absensi")
    .select("*")
    .eq("pegawai_id", pegawaiId)
    .eq("tanggal", tanggal)
    .maybeSingle();

  if (!data) throw new Error("Belum absen masuk");

  if (data.jam_pulang) throw new Error("Sudah absen pulang");

  const { error } = await supabase
    .from("absensi")
    .update({ jam_pulang: jam })
    .eq("id", data.id);

  if (error) throw error;
};