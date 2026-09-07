import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface StationSeedItem {
  no: number;
  kobag: string;
  nabag: string;
  bagian: string;
}

const stationsData: StationSeedItem[] = [
  { no: 1, kobag: "14000", nabag: "PIMPINAN DAN ADMINISTRASI", bagian: "TUK" },
  { no: 2, kobag: "14002", nabag: "POLIKLINIK", bagian: "TUK" },
  { no: 3, kobag: "14003", nabag: "MESS & PESANGGRAHAN", bagian: "TUK" },
  { no: 4, kobag: "14004", nabag: "GUDANG GULA & TETES", bagian: "TUK" },
  { no: 5, kobag: "14005", nabag: "GUDANG PERLENGKAPAN", bagian: "TUK" },
  { no: 6, kobag: "14006", nabag: "KEAMANAN/SATPAM", bagian: "TUK" },
  { no: 7, kobag: "25000", nabag: "B.U. INSTALASI", bagian: "Teknik" },
  { no: 8, kobag: "25002", nabag: "GILINGAN", bagian: "Teknik" },
  { no: 9, kobag: "25010", nabag: "KETEL", bagian: "Teknik" },
  { no: 10, kobag: "25011", nabag: "LISTRIK", bagian: "Teknik" },
  { no: 11, kobag: "25012", nabag: "BENGKEL/BESALI", bagian: "Teknik" },
  { no: 12, kobag: "25030", nabag: "B.U. KENDARAAN", bagian: "TUK" },
  { no: 13, kobag: "25040", nabag: "B.U. BANGUNAN", bagian: "TUK" },
  { no: 14, kobag: "35020", nabag: "B.U. PABRIKASI", bagian: "Pabrikasi" },
  { no: 15, kobag: "35022", nabag: "QUALITY CONTROL", bagian: "Pabrikasi" },
  { no: 16, kobag: "35023", nabag: "PEMURNIAN NIRA", bagian: "Pabrikasi" },
  { no: 17, kobag: "35024", nabag: "PENGUAPAN", bagian: "Pabrikasi" },
  { no: 18, kobag: "35025", nabag: "MASAKAN", bagian: "Pabrikasi" },
  { no: 19, kobag: "35026", nabag: "D R K", bagian: "Pabrikasi" },
  { no: 20, kobag: "35027", nabag: "PUTERAN", bagian: "Pabrikasi" },
  { no: 21, kobag: "35028", nabag: "PEMBUNGKUSAN GULA", bagian: "Pabrikasi" },
  { no: 22, kobag: "35029", nabag: "PENGELOLAAN LINGK.", bagian: "Pabrikasi" },
  { no: 23, kobag: "46000", nabag: "B.U. TANAMAN", bagian: "Tanaman" },
  { no: 24, kobag: "46002", nabag: "BIMBINGAN PETANI TR", bagian: "Tanaman" },
  { no: 25, kobag: "46003", nabag: "LABORAT HAMA/PARASIT", bagian: "Tanaman" },
  { no: 26, kobag: "46004", nabag: "TRAKTOR", bagian: "Tanaman" },
  { no: 27, kobag: "46020", nabag: "TEBANGAN TEBU", bagian: "Tanaman" },
  { no: 28, kobag: "46030", nabag: "B.U. ANGKUTAN TEBU", bagian: "Tanaman" },
];

async function main() {
  console.log("🌱 Menjalankan Seeding Master & Akun Sistem SIP-CUTI PG Trangkil...");

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash("admin123", saltRounds);

  // ----------------------------------------------------
  // 1. SEED 5 BAGIAN / DEPARTEMEN UTAMA PG TRANGKIL
  // ----------------------------------------------------
  console.log("📦 Inisialisasi 5 Bagian Utama...");
  const depts = [
    { id: "dept-pimpinan", code: "PIMPINAN", name: "Pimpinan" },
    { id: "dept-tuk", code: "TUK", name: "Tata Usaha & Keuangan (TUK)" },
    { id: "dept-tan", code: "TAN", name: "Tanaman (TAN)" },
    { id: "dept-tek", code: "TEK", name: "Teknik (TEK)" },
    { id: "dept-pab", code: "PAB", name: "Pabrikasi (PAB)" },
  ];

  for (const dept of depts) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, isActive: true },
      create: { id: dept.id, code: dept.code, name: dept.name, isActive: true },
    });
  }

  // ----------------------------------------------------
  // 2. SEED AKUN PENGGUNA (LOGIN STANDAR)
  // ----------------------------------------------------
  console.log("👤 Inisialisasi Akun Pengguna Standar...");
  const users = [
    {
      username: "admin",
      fullName: "Administrator Utama",
      role: UserRole.ADMIN_UTAMA,
      department: "ALL",
    },
    {
      username: "admintuk",
      fullName: "Admin Bagian TUK",
      role: UserRole.ADMIN_BAGIAN,
      department: "TUK",
    },
    {
      username: "admintan",
      fullName: "Admin Bagian Tanaman",
      role: UserRole.ADMIN_BAGIAN,
      department: "TAN",
    },
    {
      username: "admintek",
      fullName: "Admin Bagian Teknik",
      role: UserRole.ADMIN_BAGIAN,
      department: "TEK",
    },
    {
      username: "adminpab",
      fullName: "Admin Bagian Pabrikasi",
      role: UserRole.ADMIN_BAGIAN,
      department: "PAB",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        fullName: u.fullName,
        role: u.role,
        department: u.department,
        isActive: true,
      },
      create: {
        username: u.username,
        passwordHash: defaultPasswordHash,
        fullName: u.fullName,
        role: u.role,
        department: u.department,
        isActive: true,
      },
    });
  }

  // ----------------------------------------------------
  // 3. SEED 28 MASTER STASIUN PABRIK
  // ----------------------------------------------------
  console.log("🏭 Inisialisasi 28 Master Stasiun...");
  const existingDepts = await prisma.department.findMany();
  const findDeptId = (bagianLabel: string): string | null => {
    const target = bagianLabel.trim().toLowerCase();
    const match = existingDepts.find((d) => {
      const code = d.code.toLowerCase();
      const name = d.name.toLowerCase();
      return (
        code === target ||
        name === target ||
        name.includes(target) ||
        target.includes(code)
      );
    });
    return match ? match.id : null;
  };

  for (const item of stationsData) {
    const deptId = findDeptId(item.bagian);
    await prisma.station.upsert({
      where: { code: item.kobag },
      update: {
        name: item.nabag,
        departmentId: deptId,
        isActive: true,
      },
      create: {
        code: item.kobag,
        name: item.nabag,
        departmentId: deptId,
        isActive: true,
      },
    });
  }

  // ----------------------------------------------------
  // 4. SEED KEBIJAKAN OTOMASI SALDO CUTI
  // ----------------------------------------------------
  console.log("⚙️ Inisialisasi Kebijakan Otomasi Saldo Cuti...");
  await prisma.otomasiSaldoCuti.upsert({
    where: { jenisCuti: "CUTI_TAHUNAN" },
    update: {},
    create: {
      jenisCuti: "CUTI_TAHUNAN",
      namaKebijakan: "Cuti Tahunan",
      isOtomatisAktif: true,
      saldoDiberikan: 12,
      satuanSaldo: "HARI",
      minMasaKerja: 1,
      satuanMasaKerja: "TAHUN",
      siklusUlang: 1,
      satuanSiklus: "TAHUN",
      masaBerlaku: 1,
      satuanBerlaku: "TAHUN",
      isCarryOver: true,
      maxCarryOver: 6,
      satuanCarryOver: "HARI",
    },
  });

  await prisma.otomasiSaldoCuti.upsert({
    where: { jenisCuti: "CUTI_BESAR" },
    update: {},
    create: {
      jenisCuti: "CUTI_BESAR",
      namaKebijakan: "Cuti Besar",
      isOtomatisAktif: true,
      saldoDiberikan: 30,
      satuanSaldo: "HARI",
      minMasaKerja: 6,
      satuanMasaKerja: "TAHUN",
      siklusUlang: 6,
      satuanSiklus: "TAHUN",
      masaBerlaku: 3,
      satuanBerlaku: "TAHUN",
      isCarryOver: false,
      maxCarryOver: 0,
      satuanCarryOver: "HARI",
    },
  });

  await prisma.otomasiSaldoCuti.upsert({
    where: { jenisCuti: "INHALDAGEN" },
    update: {},
    create: {
      jenisCuti: "INHALDAGEN",
      namaKebijakan: "Cuti Inhaldagen",
      isOtomatisAktif: true,
      saldoDiberikan: 0,
      satuanSaldo: "HARI",
      minMasaKerja: 0,
      satuanMasaKerja: "TAHUN",
      siklusUlang: 0,
      satuanSiklus: "TAHUN",
      masaBerlaku: 12,
      satuanBerlaku: "BULAN",
      isCarryOver: false,
      maxCarryOver: 0,
      satuanCarryOver: "HARI",
    },
  });

  // ----------------------------------------------------
  // 5. SEED PROFIL PERUSAHAAN (KOP SURAT)
  // ----------------------------------------------------
  console.log("🏢 Inisialisasi Profil Perusahaan...");
  await prisma.profilPerusahaan.upsert({
    where: { id: "DEFAULT_PROFILE" },
    update: {},
    create: {
      id: "DEFAULT_PROFILE",
      companyName: "PT KEBON AGUNG",
      unitName: "PABRIK GULA TRANGKIL",
      location: "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
    },
  });

  // ----------------------------------------------------
  // 6. SEED PENANDATANGANAN SURAT RESMI
  // ----------------------------------------------------
  console.log("✍️ Inisialisasi Data Penandatanganan...");
  await prisma.penandatanganan.upsert({
    where: { id: "PEMIMPIN_UTAMA" },
    update: {},
    create: {
      id: "PEMIMPIN_UTAMA",
      kategori: "PEMIMPIN",
      nama: "Ir. Bambang Santoso, M.M.",
      jabatan: "General Manager",
      urutan: 0,
    },
  });

  console.log("🎉 Seeding awal sistem selesai dengan sukses!");
  console.log("   Akun default login (Password: admin123):");
  console.log("   - admin    (Admin Utama, Departemen ALL)");
  console.log("   - admintuk (Admin Bagian TUK)");
  console.log("   - admintan (Admin Bagian Tanaman)");
  console.log("   - admintek (Admin Bagian Teknik)");
  console.log("   - adminpab (Admin Bagian Pabrikasi)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
