import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedStations } from "./seed-stations";
import { seedLeaveBalances } from "./seed-leave-balances";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting minimal database seeding (Admin Utama [ALL] & Admin Bagian)...");

  // Hapus akun lama (operator, viewer, atau akun di luar 4 akun standar)
  await prisma.user.deleteMany({
    where: {
      username: {
        in: ["operator", "viewer"],
      },
    },
  });

  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash("admin123", saltRounds);

  // 1. Admin Utama (Departemen: ALL)
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Administrator Utama",
      role: UserRole.ADMIN_UTAMA,
      department: "ALL",
      isActive: true,
    },
    create: {
      username: "admin",
      passwordHash: defaultPasswordHash,
      fullName: "Administrator Utama",
      role: UserRole.ADMIN_UTAMA,
      department: "ALL",
      isActive: true,
    },
  });

  // 2. Admin Bagian A
  await prisma.user.upsert({
    where: { username: "admin_a" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian A",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian A",
      isActive: true,
    },
    create: {
      username: "admin_a",
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian A",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian A",
      isActive: true,
    },
  });

  // 3. Admin Bagian B
  await prisma.user.upsert({
    where: { username: "admin_b" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian B",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian B",
      isActive: true,
    },
    create: {
      username: "admin_b",
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian B",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian B",
      isActive: true,
    },
  });

  // 4. Admin Bagian C
  await prisma.user.upsert({
    where: { username: "admin_c" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian C",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian C",
      isActive: true,
    },
    create: {
      username: "admin_c",
      passwordHash: defaultPasswordHash,
      fullName: "Admin Bagian C",
      role: UserRole.ADMIN_BAGIAN,
      department: "Bagian C",
      isActive: true,
    },
  });

  // Hapus departemen lama yang tidak sesuai
  await prisma.department.deleteMany({
    where: {
      code: {
        notIn: ["PIMPINAN", "TUK", "TAN", "TEK", "PAB"],
      },
    },
  });

  // Seed 5 Master Departments PG Trangkil (PIMPINAN, TUK, TAN, TEK, PAB)
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

  console.log("✅ Users seeded:");
  console.log("   - admin   (Role: ADMIN_UTAMA,  Department: ALL)");
  console.log("   - admin_a (Role: ADMIN_BAGIAN, Department: Bagian A)");
  console.log("   - admin_b (Role: ADMIN_BAGIAN, Department: Bagian B)");
  console.log("   - admin_c (Role: ADMIN_BAGIAN, Department: Bagian C)");
  console.log("✅ 5 Bagian seeded: PIMPINAN, TUK, TAN, TEK, PAB");

  // Seed 28 Master Stasiun
  await seedStations();

  // Seed Saldo Cuti Karyawan
  await seedLeaveBalances();

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
