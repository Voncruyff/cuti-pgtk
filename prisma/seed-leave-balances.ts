import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedLeaveBalances() {
  console.log("🌱 Menyiapkan tabel saldo_cuti di database MySQL...");

  const employees = await prisma.employee.findMany({
    include: {
      leaveBalance: true,
    },
  });

  console.log(`Ditemukan ${employees.length} karyawan di database.`);

  let createdCount = 0;
  for (const emp of employees) {
    if (!emp.leaveBalance) {
      await prisma.leaveBalance.create({
        data: {
          nip: emp.nip,
          nama: emp.nama,
          cutiTahunan: 12, // Urutan 1: Cuti Tahunan
          cutiBesar: 0,    // Urutan 2: Cuti Besar
          inhaldagen: 0,   // Urutan 3: Inhaldagen
          total: 12,
          periode: 2026,
        },
      });
      createdCount++;
    }
  }

  console.log(`✅ Berhasil menginisialisasi ${createdCount} data saldo cuti baru di tabel 'saldo_cuti'.`);
}

seedLeaveBalances()
  .catch((e) => {
    console.error("❌ Gagal inisialisasi saldo cuti:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
