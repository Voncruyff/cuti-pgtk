#!/bin/sh
set -e

echo "================================================="
echo "🚀 Memulai Layanan SIP-CUTI PG Trangkil..."
echo "================================================="

# Menunggu koneksi MySQL di port yang ditentukan
DB_TARGET_HOST="${DB_HOST:-db}"
DB_TARGET_PORT="${DB_PORT:-3306}"

echo "⏳ Menunggu koneksi MySQL di ${DB_TARGET_HOST}:${DB_TARGET_PORT}..."
while ! nc -z "$DB_TARGET_HOST" "$DB_TARGET_PORT"; do
  sleep 1
done
echo "✅ Database MySQL berhasil terhubung!"

# Otomatis sinkronisasi tabel Prisma
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "🔄 Menyelaraskan skema tabel database (prisma db push)..."
  prisma db push --skip-generate
  echo "✅ Skema tabel database telah siap!"
fi

# Otomatis seed data jika diaktifkan
if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo "🌱 Menjalankan seeding master data & akun standar..."
  tsx prisma/seed.ts || echo "⚠️ Seeding selesai/dilewati."
fi

# Pastikan direktori unggahan foto profil tersedia
mkdir -p /app/public/uploads/profile /app/uploads/profile 2>/dev/null || true

echo "================================================="
echo "🌐 Server aktif di http://0.0.0.0:${PORT:-3000}"
echo "================================================="

exec "$@"
