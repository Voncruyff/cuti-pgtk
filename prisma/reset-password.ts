import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
  // Ambil argumen username dan password baru (opsional, default: admin & admin123)
  const targetUsername = process.argv[2] || "admin";
  const newPassword = process.argv[3] || "admin123";

  console.log("\n=================================================");
  console.log(`🔐 Proses Reset Password Darurat...`);
  console.log(`👤 Target User: ${targetUsername}`);
  console.log("=================================================");

  const user = await prisma.user.findUnique({
    where: { username: targetUsername },
  });

  if (!user) {
    console.error(`❌ Error: User dengan username '${targetUsername}' tidak ditemukan!`);
    console.log("💡 Tips: Periksa kembali username akun yang ingin direset.");
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true, // Pastikan akun langsung aktif jika sebelumnya nonaktif
    },
  });

  console.log(`✅ BERHASIL! Akun '${user.username}' (${user.fullName}) berhasil direset.`);
  console.log(`🔑 Password Baru : ${newPassword}`);
  console.log("👉 Silakan login kembali melalui halaman login aplikasi.");
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
