export default function Header({ pegawai }) {
  return (
    <header className="header">

      <div>
        <h1>
          Dashboard
        </h1>

        <p>
          Sistem Absensi Pemerintah
        </p>
      </div>

      <div className="profile">

        <h3>
          {pegawai.nama}
        </h3>

        <span>
          {pegawai.jabatan}
        </span>

      </div>

    </header>
  );
}