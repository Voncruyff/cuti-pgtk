import { prisma } from "../src/lib/db/prisma";

async function seed() {
  const depts = await prisma.department.findMany();
  console.log(
    "Available depts:",
    depts.map((d) => ({ id: d.id, code: d.code, name: d.name }))
  );

  await prisma.penandatanganan.deleteMany();

  // 1. Pemimpin
  await prisma.penandatanganan.create({
    data: {
      id: "PEMIMPIN_UTAMA",
      kategori: "PEMIMPIN",
      nama: "Robert Lewandowski",
      jabatan: "Pimpinan",
      urutan: 0,
    },
  });

  const pab = depts.find((d) => d.code === "PAB");
  const tan = depts.find((d) => d.code === "TAN");
  const tek = depts.find((d) => d.code === "TEK");
  const tuk = depts.find((d) => d.code === "TUK");

  if (pab) {
    await prisma.penandatanganan.create({
      data: {
        kategori: "BAGIAN",
        nama: "Joko",
        jabatan: "Kepala Bagian Pabrikasi",
        departmentId: pab.id,
        urutan: 1,
      },
    });
  }

  if (tan) {
    await prisma.penandatanganan.create({
      data: {
        kategori: "BAGIAN",
        nama: "Hendra",
        jabatan: "Kepala Bagian Tanaman",
        departmentId: tan.id,
        urutan: 2,
      },
    });
  }

  if (tek) {
    await prisma.penandatanganan.create({
      data: {
        kategori: "BAGIAN",
        nama: "Luki",
        jabatan: "Kepala Bagian Teknik",
        departmentId: tek.id,
        urutan: 3,
      },
    });
  }

  if (tuk) {
    await prisma.penandatanganan.create({
      data: {
        kategori: "BAGIAN",
        nama: "IMoro",
        jabatan: "Kepala Bagian TUK",
        departmentId: tuk.id,
        urutan: 4,
      },
    });
  }

  const all = await prisma.penandatanganan.findMany({
    include: { department: true },
    orderBy: { urutan: "asc" },
  });
  console.log("Penandatanganan in DB now:");
  console.table(
    all.map((a) => ({
      id: a.id,
      kategori: a.kategori,
      nama: a.nama,
      jabatan: a.jabatan,
      dept: a.department?.code || "-",
    }))
  );
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
