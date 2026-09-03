/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      { source: "/dasbor", destination: "/dashboard", permanent: true },
      { source: "/employees", destination: "/master-karyawan", permanent: true },
      { source: "/karyawan", destination: "/master-karyawan", permanent: true },
      { source: "/masterkaryawan", destination: "/master-karyawan", permanent: true },
      { source: "/departments", destination: "/master-bagian", permanent: true },
      { source: "/bagian", destination: "/master-bagian", permanent: true },
      { source: "/masterbagian", destination: "/master-bagian", permanent: true },
      { source: "/stations", destination: "/master-stasiun", permanent: true },
      { source: "/stasiun", destination: "/master-stasiun", permanent: true },
      { source: "/masterstasiun", destination: "/master-stasiun", permanent: true },
      { source: "/reports", destination: "/laporan-cuti", permanent: true },
      { source: "/reports/summary", destination: "/laporan-cuti", permanent: true },
      { source: "/laporan", destination: "/laporan-cuti", permanent: true },
      { source: "/users", destination: "/kelola-user", permanent: true },
      { source: "/pengguna", destination: "/kelola-user", permanent: true },
      { source: "/kelolauser", destination: "/kelola-user", permanent: true },
      { source: "/balances/add", destination: "/tambah-saldo-cuti", permanent: true },
      { source: "/saldo/tambah", destination: "/tambah-saldo-cuti", permanent: true },
      { source: "/tambahsaldocuti", destination: "/tambah-saldo-cuti", permanent: true },
      { source: "/tambah-saldo", destination: "/tambah-saldo-cuti", permanent: true },
      { source: "/leave/create", destination: "/ambil-cuti", permanent: true },
      { source: "/cuti/buat", destination: "/ambil-cuti", permanent: true },
      { source: "/ambilcuti", destination: "/ambil-cuti", permanent: true },
      { source: "/leave/details", destination: "/rincian-cuti", permanent: true },
      { source: "/cuti/rincian", destination: "/rincian-cuti", permanent: true },
      { source: "/rinciancuti", destination: "/rincian-cuti", permanent: true },
      { source: "/pengaturan/kebijakan", destination: "/pengaturan/automasi-saldo", permanent: true },
      { source: "/pengaturan/profil", destination: "/pengaturan/profil-perusahaan", permanent: true },
      { source: "/pengaturan/keamanan", destination: "/pengaturan/keamanan-akun", permanent: true },
    ];
  },
};

export default nextConfig;
