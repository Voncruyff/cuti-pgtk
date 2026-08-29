import { PrismaClient } from "@prisma/client";

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

export async function seedStations() {
  console.log("🏭 Starting Seeding Master Stasiun (KOBAG & NABAG)...");

  // Ambil semua departemen yang ada di DB
  const departments = await prisma.department.findMany();

  console.log("Found departments in DB:", departments.map(d => `${d.code}: ${d.name}`).join(", "));

  // Helper matcher untuk mencari ID departemen
  const findDeptId = (bagianLabel: string): string | null => {
    const target = bagianLabel.trim().toLowerCase();
    const match = departments.find((d) => {
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

  let insertedCount = 0;

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

    insertedCount++;
  }

  console.log(`✅ Berhasil melakukan seed ${insertedCount} Master Stasiun ke tabel 'stations'!`);
}

seedStations()
  .catch((e) => {
    console.error("❌ Seeding stations failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
