import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const firstNames = [
  "Ahmad", "Budi", "Bambang", "Agus", "Dedi", "Eko", "Fajar", "Gilang", "Hadi", "Indra",
  "Joko", "Kurniawan", "Lukman", "Muhammad", "Nanang", "Oki", "Prasetyo", "Rizki", "Surya", "Teguh",
  "Untung", "Wahyu", "Yanto", "Zainal", "Arief", "Bayu", "Cahyo", "Dimas", "Edi", "Farhan",
  "Gunawan", "Hendra", "Irfan", "Jamal", "Krisna", "Leo", "Mulyadi", "Nugroho", "Panji", "Rahmat",
  "Sigit", "Tri", "Wawan", "Yoga", "Zulfikar", "Adi", "Bagaskara", "Danang", "Erwin", "Ferry",
  "Galih", "Hari", "Ilham", "Jefri", "Koko", "Latif", "Maulana", "Nanda", "Pandu", "Rian",
  "Satria", "Taufik", "Wicaksono", "Yuda", "Zulham", "Anwar", "Bagus", "Dicky", "Endra", "Fikri",
  "Guntur", "Hasan", "Imam", "Johan", "Kusuma", "Lutfi", "Marwan", "Nasir", "Putra", "Roni",
  "Samsul", "Tommy", "Widodo", "Yusuf", "Zakaria", "Akbar", "Basuki", "Doni", "Fachri", "Firmansyah"
];

const middleNames = [
  "Setiawan", "Pratama", "Saputra", "Hidayat", "Wijaya", "Santoso", "Kusuma", "Wibowo", "Nugraha", "Firmansyah",
  "Ramadhan", "Purnama", "Kurnia", "Permana", "Hakim", "Riyadi", "Utomo", "Prasetya", "Sudrajat", "Susanto",
  "Budiman", "Subagyo", "Hartono", "Gunawan", "Mahendra", "Wahyudi", "Hermawan", "Iskandar", "Suryono", "Mulyono"
];

const lastNames = [
  "Wibowo", "Nugroho", "Prasetyo", "Kusumo", "Handoko", "Utomo", "Suharto", "Sulistyo", "Purwanto", "Hariyanto",
  "Purnomo", "Suwandi", "Triyono", "Widodo", "Sugiarto", "Herlambang", "Sudirman", "Baskoro", "Darmawan", "Wardhana",
  "Pangestu", "Suryadi", "Kuntoro", "Hartanto", "Priambodo", "Subekti", "Sumitro", "Wicaksono", "Yulianto", "Zulkarnain"
];

function generateUniqueNames(count: number): string[] {
  const names = new Set<string>();
  let attempts = 0;
  while (names.size < count && attempts < count * 20) {
    attempts++;
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const m = middleNames[Math.floor(Math.random() * middleNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${f} ${m} ${l}`;
    names.add(name);
  }
  const result = Array.from(names);
  let index = 1;
  while (result.length < count) {
    result.push(`Karyawan ${index++}`);
  }
  return result;
}

async function main() {
  console.log("🚀 Memulai proses pembersihan & generate 500 karyawan...");

  // 1. Hapus karyawan bagian HURU HARA jika ada
  console.log("🧹 Menghapus karyawan dari bagian HURU HARA...");
  await prisma.employee.deleteMany({
    where: {
      OR: [
        { bagian: { contains: "HURU HARA" } },
        { bagian: "HUR" },
      ],
    },
  });

  // 2. Hapus bagian HURU HARA dari tabel bagian (department)
  console.log("🧹 Menghapus master bagian HURU HARA dari tabel 'bagian'...");
  const delHUR = await prisma.department.deleteMany({
    where: {
      OR: [
        { code: "HUR" },
        { name: { contains: "HURU" } },
      ],
    },
  });
  console.log(`   ✓ Terhapus ${delHUR.count} record bagian HURU HARA.`);

  // 3. Hapus data relasi aktivitas saldo dan saldo cuti terlebih dahulu
  console.log("🧹 Menghapus seluruh aktivitas saldo lama...");
  await prisma.balanceActivity.deleteMany();

  console.log("🧹 Menghapus seluruh saldo cuti lama...");
  await prisma.leaveBalance.deleteMany();

  console.log("🧹 Menghapus semua karyawan lama...");
  const deleteResult = await prisma.employee.deleteMany();
  console.log(`✅ Berhasil mengosongkan ${deleteResult.count} data karyawan lama.`);

  // 4. Ambil data bagian & stasiun yang valid di DB (hanya 4 bagian resmi PG Trangkil)
  const departments = await prisma.department.findMany({
    where: {
      code: { in: ["PAB", "TAN", "TEK", "TUK"] },
    },
    include: {
      stations: true,
    },
  });

  if (departments.length === 0) {
    throw new Error("Tidak ditemukan departemen standar (PAB, TAN, TEK, TUK). Pastikan master bagian sudah ada.");
  }

  // Siapkan pool stasiun yang valid
  const stationPool: { bagian: string; stationId: string; stasiun: string }[] = [];
  for (const dept of departments) {
    if (dept.stations && dept.stations.length > 0) {
      for (const st of dept.stations) {
        stationPool.push({
          bagian: dept.name,
          stationId: st.id,
          stasiun: st.name,
        });
      }
    } else {
      stationPool.push({
        bagian: dept.name,
        stationId: "",
        stasiun: "-",
      });
    }
  }

  console.log(`📍 Tersedia ${stationPool.length} kombinasi stasiun/bagian untuk penempatan.`);

  // 5. Generate 500 nama unik
  const names = generateUniqueNames(500);

  // Komposisi 500 Karyawan:
  // - 40 Karyawan Pimpinan (Tanggal pengangkatan selalu tanggal 1, bulan bervariasi Jan-Des, tahun 2012-2021)
  // - 5 Karyawan Baru Pelaksana (Tanggal pengangkatan selalu tanggal 1, bulan bervariasi di tahun 2026, saldo 0)
  // - 455 Karyawan Pelaksana Reguler (Tanggal pengangkatan selalu tanggal 1, bulan bervariasi Jan-Des, tahun 2015-2024, saldo 12)
  console.log("📋 Menyiapkan data 500 karyawan:");
  console.log("   - 40 Karyawan Pimpinan (Kategori: PIMPINAN, Jabatan: Kosong, Tgl Pengangkatan: Tgl 1 beda bulan)");
  console.log("   - 5 Karyawan Baru Pelaksana (Kategori: PELAKSANA, Pengangkatan: 2026 Tgl 1 beda bulan, Saldo: 0)");
  console.log("   - 455 Karyawan Pelaksana (Kategori: PELAKSANA, Jabatan: Kosong, Tgl Pengangkatan: Tgl 1 beda bulan, Saldo: 12)");

  let nameIndex = 0;

  // Tanggal pengangkatan khusus untuk 5 karyawan baru (< 1 tahun kerja pada tahun 2026):
  // Semuanya tanggal 1, beda bulan (Feb, Mar, Apr, Mei, Jun 2026)
  const newEmployeeDates = [
    new Date(Date.UTC(2026, 1, 1)), // 01 Februari 2026
    new Date(Date.UTC(2026, 2, 1)), // 01 Maret 2026
    new Date(Date.UTC(2026, 3, 1)), // 01 April 2026
    new Date(Date.UTC(2026, 4, 1)), // 01 Mei 2026
    new Date(Date.UTC(2026, 5, 1)), // 01 Juni 2026
  ];

  const employeesToCreate: {
    nip: string;
    nama: string;
    jabatan: string;
    bagian: string;
    category: "PIMPINAN" | "PELAKSANA";
    stationId: string | null;
    stasiun: string | null;
    appointmentDate: Date;
    initialAnnual: number;
    initialLongLeave: number;
    initialInhaldagen: number;
  }[] = [];

  // A. 40 Karyawan Pimpinan
  for (let i = 1; i <= 40; i++) {
    const nip = String(10000 + i); // 10001 - 10040
    const nama = names[nameIndex++];
    const loc = stationPool[(i - 1) % stationPool.length];
    
    // Tanggal selalu 1, bulan bervariasi 0-11 (Januari s/d Desember), tahun 2012 s/d 2021
    const year = 2012 + ((i - 1) % 10);
    const month = (i - 1) % 12; // Beda bulan untuk setiap karyawan
    const appointmentDate = new Date(Date.UTC(year, month, 1)); // Tanggal selalu 1

    employeesToCreate.push({
      nip,
      nama,
      jabatan: "", // Kosongkan atribut jabatan sesuai permintaan
      bagian: loc.bagian,
      category: "PIMPINAN",
      stationId: loc.stationId || null,
      stasiun: loc.stasiun || null,
      appointmentDate,
      initialAnnual: 12,
      initialLongLeave: 0,
      initialInhaldagen: 0,
    });
  }

  // B. 5 Karyawan Baru Pelaksana (< 1 tahun kerja)
  for (let i = 1; i <= 5; i++) {
    const nip = String(20000 + i); // 20001 - 20005
    const nama = names[nameIndex++];
    const loc = stationPool[(i + 39) % stationPool.length];
    const appointmentDate = newEmployeeDates[i - 1]; // Selalu tanggal 1, beda bulan di tahun 2026

    employeesToCreate.push({
      nip,
      nama,
      jabatan: "", // Kosongkan atribut jabatan sesuai permintaan
      bagian: loc.bagian,
      category: "PELAKSANA",
      stationId: loc.stationId || null,
      stasiun: loc.stasiun || null,
      appointmentDate,
      initialAnnual: 0, // Karyawan baru belum mendapatkan hak cuti tahunan
      initialLongLeave: 0,
      initialInhaldagen: 0,
    });
  }

  // C. 455 Karyawan Pelaksana Reguler
  for (let i = 6; i <= 460; i++) {
    const nip = String(20000 + i); // 20006 - 20460
    const nama = names[nameIndex++];
    const loc = stationPool[(i + 39) % stationPool.length];

    // Tanggal selalu 1, bulan bervariasi 0-11 (Januari s/d Desember), tahun 2015 s/d 2024
    const year = 2015 + ((i - 1) % 10);
    const month = (i - 1) % 12; // Beda bulan untuk setiap karyawan
    const appointmentDate = new Date(Date.UTC(year, month, 1)); // Tanggal selalu 1

    employeesToCreate.push({
      nip,
      nama,
      jabatan: "", // Kosongkan atribut jabatan sesuai permintaan
      bagian: loc.bagian,
      category: "PELAKSANA",
      stationId: loc.stationId || null,
      stasiun: loc.stasiun || null,
      appointmentDate,
      initialAnnual: 12,
      initialLongLeave: 0,
      initialInhaldagen: 0,
    });
  }

  console.log(`📦 Memasukkan ${employeesToCreate.length} data karyawan ke database dalam batch...`);

  // Batch insert per 50 karyawan
  const batchSize = 50;
  for (let b = 0; b < employeesToCreate.length; b += batchSize) {
    const chunk = employeesToCreate.slice(b, b + batchSize);
    await prisma.$transaction(
      chunk.map((emp) =>
        prisma.employee.create({
          data: {
            nip: emp.nip,
            nama: emp.nama,
            jabatan: emp.jabatan, // Dikosongi ("")
            bagian: emp.bagian,
            category: emp.category,
            stationId: emp.stationId,
            stasiun: emp.stasiun,
            appointmentDate: emp.appointmentDate,
            isActive: true,
            leaveBalance: {
              create: {
                nama: emp.nama,
                cutiTahunan: emp.initialAnnual,
                cutiBesar: emp.initialLongLeave,
                inhaldagen: emp.initialInhaldagen,
                total: emp.initialAnnual + emp.initialLongLeave + emp.initialInhaldagen,
                periode: 2026,
              },
            },
          },
        })
      )
    );
    process.stdout.write(`   ✓ Dimasukkan: ${Math.min(b + batchSize, employeesToCreate.length)} / ${employeesToCreate.length}\r`);
  }

  console.log("\n✨ Verifikasi data di database:");
  const totalCount = await prisma.employee.count();
  const pimpinanCount = await prisma.employee.count({ where: { category: "PIMPINAN" } });
  const pelaksanaCount = await prisma.employee.count({ where: { category: "PELAKSANA" } });
  const newPelaksanaCount = await prisma.employee.count({
    where: {
      category: "PELAKSANA",
      appointmentDate: { gte: new Date("2026-01-01") },
    },
  });
  const balanceCount = await prisma.leaveBalance.count();
  const emptyJabatanCount = await prisma.employee.count({ where: { jabatan: "" } });
  const huruHaraDeptCount = await prisma.department.count({
    where: {
      OR: [{ code: "HUR" }, { name: { contains: "HURU" } }],
    },
  });
  const huruHaraEmpCount = await prisma.employee.count({
    where: {
      OR: [{ bagian: { contains: "HURU" } }, { bagian: "HUR" }],
    },
  });

  console.log(`   - Total Karyawan      : ${totalCount}`);
  console.log(`   - Karyawan Pimpinan   : ${pimpinanCount}`);
  console.log(`   - Karyawan Pelaksana  : ${pelaksanaCount} (termasuk ${newPelaksanaCount} Karyawan Baru 2026)`);
  console.log(`   - Jabatan Kosong      : ${emptyJabatanCount} / ${totalCount}`);
  console.log(`   - Saldo Cuti Tersedia : ${balanceCount} data`);
  console.log(`   - Bagian HURU HARA    : ${huruHaraDeptCount} (Terhapus)`);
  console.log(`   - Karyawan HURU HARA  : ${huruHaraEmpCount} (Terhapus)`);
  console.log("🎉 Berhasil memperbarui database!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
