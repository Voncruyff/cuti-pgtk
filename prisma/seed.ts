import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =====================================================================
// DATA MASTER BAGIAN (DEPARTEMEN) PG TRANGKIL
// =====================================================================
interface DepartmentSeedItem {
  id: string;
  code: string;
  name: string;
}

const departmentsData: DepartmentSeedItem[] = [
  {
    id: "dept-tuk",
    code: "TUK",
    name: "Tata Usaha & Keuangan (TUK)",
  },
  {
    id: "dept-tan",
    code: "TAN",
    name: "Tanaman (TAN)",
  },
  {
    id: "dept-tek",
    code: "TEK",
    name: "Teknik (TEK)",
  },
  {
    id: "dept-pab",
    code: "PAB",
    name: "Pabrikasi (PAB)",
  },
];

// =====================================================================
// DATA MASTER 28 STASIUN PABRIK PG TRANGKIL
// =====================================================================
interface StationSeedItem {
  no: number;
  kobag: string;
  nabag: string;
  departmentCode: string;
  departmentId: string;
}

const stationsData: StationSeedItem[] = [
  // --- 1. Bagian TUK (8 Stasiun) ---
  { no: 1, kobag: "14000", nabag: "PIMPINAN DAN ADMINISTRASI", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 2, kobag: "14002", nabag: "POLIKLINIK", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 3, kobag: "14003", nabag: "MESS & PESANGGRAHAN", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 4, kobag: "14004", nabag: "GUDANG GULA & TETES", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 5, kobag: "14005", nabag: "GUDANG PERLENGKAPAN", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 6, kobag: "14006", nabag: "KEAMANAN/SATPAM", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 7, kobag: "25030", nabag: "B.U. KENDARAAN", departmentCode: "TUK", departmentId: "dept-tuk" },
  { no: 8, kobag: "25040", nabag: "B.U. BANGUNAN", departmentCode: "TUK", departmentId: "dept-tuk" },

  // --- 2. Bagian Teknik (5 Stasiun) ---
  { no: 9, kobag: "25000", nabag: "B.U. INSTALASI", departmentCode: "TEK", departmentId: "dept-tek" },
  { no: 10, kobag: "25002", nabag: "GILINGAN", departmentCode: "TEK", departmentId: "dept-tek" },
  { no: 11, kobag: "25010", nabag: "KETEL", departmentCode: "TEK", departmentId: "dept-tek" },
  { no: 12, kobag: "25011", nabag: "LISTRIK", departmentCode: "TEK", departmentId: "dept-tek" },
  { no: 13, kobag: "25012", nabag: "BENGKEL/BESALI", departmentCode: "TEK", departmentId: "dept-tek" },

  // --- 3. Bagian Pabrikasi (9 Stasiun) ---
  { no: 14, kobag: "35020", nabag: "B.U. PABRIKASI", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 15, kobag: "35022", nabag: "QUALITY CONTROL", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 16, kobag: "35023", nabag: "PEMURNIAN NIRA", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 17, kobag: "35024", nabag: "PENGUAPAN", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 18, kobag: "35025", nabag: "MASAKAN", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 19, kobag: "35026", nabag: "D R K", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 20, kobag: "35027", nabag: "PUTERAN", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 21, kobag: "35028", nabag: "PEMBUNGKUSAN GULA", departmentCode: "PAB", departmentId: "dept-pab" },
  { no: 22, kobag: "35029", nabag: "PENGELOLAAN LINGK.", departmentCode: "PAB", departmentId: "dept-pab" },

  // --- 4. Bagian Tanaman (6 Stasiun) ---
  { no: 23, kobag: "46000", nabag: "B.U. TANAMAN", departmentCode: "TAN", departmentId: "dept-tan" },
  { no: 24, kobag: "46002", nabag: "BIMBINGAN PETANI TR", departmentCode: "TAN", departmentId: "dept-tan" },
  { no: 25, kobag: "46003", nabag: "LABORAT HAMA/PARASIT", departmentCode: "TAN", departmentId: "dept-tan" },
  { no: 26, kobag: "46004", nabag: "TRAKTOR", departmentCode: "TAN", departmentId: "dept-tan" },
  { no: 27, kobag: "46020", nabag: "TEBANGAN TEBU", departmentCode: "TAN", departmentId: "dept-tan" },
  { no: 28, kobag: "46030", nabag: "B.U. ANGKUTAN TEBU", departmentCode: "TAN", departmentId: "dept-tan" },
];

async function main() {
  console.log("🌱 Menjalankan Seeding Master & Akun Sistem SIP-CUTI PG Trangkil...");

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash("admin123", saltRounds);

  // =====================================================================
  // 1. SEED 4 BAGIAN / DEPARTEMEN UTAMA PG TRANGKIL
  // =====================================================================
  console.log("\n📦 1. Mengisi Data Master 4 Bagian PG Trangkil...");
  for (const dept of departmentsData) {
    const res = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        isActive: true,
      },
      create: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        isActive: true,
      },
    });
    console.log(`   ✓ [${res.code}] ${res.name}`);
  }

  // =====================================================================
  // 2. SEED 28 MASTER STASIUN PABRIK PG TRANGKIL
  // =====================================================================
  console.log("\n🏭 2. Mengisi Data Master 28 Stasiun Pabrik PG Trangkil...");
  let countStasiun = 0;
  for (const item of stationsData) {
    const res = await prisma.station.upsert({
      where: { code: item.kobag },
      update: {
        name: item.nabag,
        departmentId: item.departmentId,
        isActive: true,
      },
      create: {
        code: item.kobag,
        name: item.nabag,
        departmentId: item.departmentId,
        isActive: true,
      },
    });
    countStasiun++;
    console.log(`   ✓ [KOBAG: ${res.code}] ${res.name.padEnd(26)} -> Bagian: ${item.departmentCode}`);
  }
  console.log(`   Total Stasiun Berhasil Di-seed: ${countStasiun} stasiun.`);

  // =====================================================================
  // 3. SEED AKUN PENGGUNA (LOGIN STANDAR SISTEM)
  // =====================================================================
  console.log("\n👤 3. Mengisi Akun Login Standar (Password: admin123)...");
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
    console.log(`   ✓ User: ${u.username.padEnd(10)} | Role: ${u.role.padEnd(12)} | Bagian: ${u.department}`);
  }

  // =====================================================================
  // 4. SEED KEBIJAKAN OTOMASI SALDO CUTI
  // =====================================================================
  console.log("\n⚙️ 4. Mengisi Konfigurasi Otomasi Saldo Cuti...");
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
  console.log("   ✓ Kebijakan Cuti Tahunan (12 hari/tahun, carry-over maks 6 hari)");

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
  console.log("   ✓ Kebijakan Cuti Besar (30 hari setiap kelipatan 6 tahun, masa berlaku 3 tahun)");

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
  console.log("   ✓ Kebijakan Inhaldagen (Masa berlaku 12 bulan)");

  // =====================================================================
  // 5. SEED PROFIL PERUSAHAAN (KOP SURAT DOKUMEN CETAK)
  // =====================================================================
  console.log("\n🏢 5. Mengisi Profil Perusahaan PG Trangkil...");
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
  console.log("   ✓ Profil: PT KEBON AGUNG - PABRIK GULA TRANGKIL");

  // =====================================================================
  // 6. SEED DATA PENANDATANGANAN RESMI (LEAVE LETTER & LAPORAN)
  // =====================================================================
  console.log("\n✍️ 6. Mengisi Data Penandatanganan Resmi...");
  // Pimpinan Utama / General Manager
  await prisma.penandatanganan.upsert({
    where: { id: "PEMIMPIN_UTAMA" },
    update: {
      nama: "Ir. Bambang Santoso, M.M.",
      jabatan: "General Manager",
    },
    create: {
      id: "PEMIMPIN_UTAMA",
      kategori: "PEMIMPIN",
      nama: "Ir. Bambang Santoso, M.M.",
      jabatan: "General Manager",
      urutan: 0,
    },
  });

  // Penandatangan per bagian
  const signers = [
    { id: "sig-tuk", deptId: "dept-tuk", nama: "Teguh Arifin", jabatan: "Pjs. Kepala Bagian TUK", urutan: 1 },
    { id: "sig-tan", deptId: "dept-tan", nama: "Hendra", jabatan: "Kepala Bagian Tanaman", urutan: 2 },
    { id: "sig-tek", deptId: "dept-tek", nama: "Luki", jabatan: "Kepala Bagian Teknik", urutan: 3 },
    { id: "sig-pab", deptId: "dept-pab", nama: "Joko", jabatan: "Kepala Bagian Pabrikasi", urutan: 4 },
  ];

  for (const s of signers) {
    const existing = await prisma.penandatanganan.findFirst({
      where: { departmentId: s.deptId },
    });
    if (!existing) {
      await prisma.penandatanganan.create({
        data: {
          id: s.id,
          kategori: "BAGIAN",
          nama: s.nama,
          jabatan: s.jabatan,
          departmentId: s.deptId,
          urutan: s.urutan,
        },
      });
    }
  }
  console.log("   ✓ Penandatangan GM & 4 Kepala Bagian terdaftar.");

  console.log("\n=====================================================================");
  console.log("🎉 SEEDING BERHASIL: 4 Bagian, 28 Stasiun, 5 Akun, Konfigurasi & Profil Siap!");
  console.log("=====================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
