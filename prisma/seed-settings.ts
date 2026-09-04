import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Inisialisasi tabel otomasi_saldo_cuti dan profil_perusahaan...");

  // 1. Inisialisasi Otomasi Cuti Tahunan
  const annual = await prisma.otomasiSaldoCuti.upsert({
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
  console.log("✓ Cuti Tahunan terdaftar:", annual.namaKebijakan, "| Status Otomasi:", annual.isOtomatisAktif);

  // 2. Inisialisasi Otomasi Cuti Besar
  const longLeave = await prisma.otomasiSaldoCuti.upsert({
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
  console.log("✓ Cuti Besar terdaftar:", longLeave.namaKebijakan, "| Status Otomasi:", longLeave.isOtomatisAktif);

  // 3. Inisialisasi Profil Perusahaan
  const profile = await prisma.profilPerusahaan.upsert({
    where: { id: "DEFAULT_PROFILE" },
    update: {},
    create: {
      id: "DEFAULT_PROFILE",
      companyName: "PT KEBON AGUNG",
      unitName: "PABRIK GULA TRANGKIL",
      location: "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
    },
  });
  console.log("✓ Profil Perusahaan terdaftar:", profile.unitName, "-", profile.companyName);

  // 4. Inisialisasi Penandatanganan Pemimpin
  const signatory = await prisma.penandatanganan.upsert({
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
  console.log("✓ Penandatanganan Pemimpin terdaftar:", signatory.nama, "-", signatory.jabatan);

  console.log("Semua tabel dan data awal berhasil diverifikasi di database MySQL!");
}

main()
  .catch((e) => {
    console.error("Error seeding settings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
