import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
  // Ambil argumen username dan password baru (opsional, default: "admin" atau akun ADMIN_UTAMA)
  const argTarget = process.argv[2];
  const newPassword = process.argv[3] || "admin123";

  console.log("\n=================================================");
  console.log("🔐 ALAT RESET PASSWORD DARURAT (SIP-CUTI)");
  console.log("=================================================");

  let user = null;

  if (argTarget) {
    // 1. Cari berdasarkan username persis
    user = await prisma.user.findUnique({
      where: { username: argTarget },
    });

    // 2. Jika tidak ditemukan, coba cari case-insensitive
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: { equals: argTarget } },
      });
    }
  } else {
    // Jika tidak menyebutkan target, prioritaskan cari akun 'admin' atau akun ADMIN_UTAMA
    user = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: "ADMIN_UTAMA" },
      });
      if (user) {
        console.log(`ℹ️ Username 'admin' tidak ditemukan, otomatis mendeteksi akun ADMIN_UTAMA: '${user.username}'`);
      }
    }
  }

  if (!user) {
    console.error(`\n❌ Error: Akun ${argTarget ? `'${argTarget}' ` : ""}tidak ditemukan di database!`);
    
    // Tampilkan daftar semua akun yang ada di database agar admin tahu username yang benar
    const allUsers = await prisma.user.findMany({
      select: { username: true, fullName: true, role: true, department: true, isActive: true },
      orderBy: { role: "asc" },
    });

    if (allUsers.length === 0) {
      console.log("⚠️ Database belum memiliki akun sama sekali. Jalankan seeding: npm run db:seed");
    } else {
      console.log("\n📋 Daftar akun yang terdaftar di database saat ini:");
      console.log("------------------------------------------------------------------");
      allUsers.forEach((u, i) => {
        const status = u.isActive ? "Aktif" : "Nonaktif";
        console.log(` ${i + 1}. Username : ${u.username.padEnd(16)} | Role: ${u.role.padEnd(14)} | Nama: ${u.fullName} (${status})`);
      });
      console.log("------------------------------------------------------------------");
      console.log("\n👉 Cara reset akun tertentu:");
      console.log("   npm run db:reset-password <username> <password_baru>");
      console.log("   Contoh: npm run db:reset-password admintuk passwordbaru123\n");
    }
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true, // Pastikan akun aktif
    },
  });

  console.log(`✅ BERHASIL! Password untuk akun berikut telah direset:`);
  console.log(`   - Username  : ${user.username}`);
  console.log(`   - Nama      : ${user.fullName}`);
  console.log(`   - Role      : ${user.role}`);
  console.log(`   - Bagian    : ${user.department || "-"}`);
  console.log(`   - Password  : ${newPassword}`);
  console.log("\n👉 Silakan login kembali dengan kredensial di atas.");
  console.log("=================================================\n");
}

resetPassword()
  .catch((err) => {
    console.error("❌ Terjadi kesalahan saat reset password:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
