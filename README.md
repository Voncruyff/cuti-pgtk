# SIP-CUTI PG TRANGKIL
### Sistem Informasi Manajemen & Pengelolaan Cuti Karyawan
**PT Kebon Agung — Pabrik Gula Trangkil, Pati, Jawa Tengah**

---

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT_+_bcrypt-FB7C08?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-Framer_v13-FF4154?style=for-the-badge&logo=framer&logoColor=white)

| Kategori | Teknologi |
| :--- | :--- |
| **Framework** | Next.js 15 App Router (React Server Components + Server Actions) |
| **UI Library** | React 19 |
| **Bahasa** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS 3 |
| **Animasi** | Motion for React (Framer Motion v13) |
| **Basis Data** | MySQL 8.0+ (XAMPP / MariaDB / MySQL Community) |
| **ORM** | Prisma ORM 5 |
| **Autentikasi** | JWT via `jose` + `bcryptjs` (HttpOnly Cookie) |
| **Validasi Form** | React Hook Form + Zod |
| **Tanggal** | date-fns |
| **Notifikasi** | Sonner (Toast) |
| **Ikon** | Lucide React |
| **Crop Foto** | react-easy-crop |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
Pastikan software berikut sudah terinstal di komputer Anda:
- **Node.js** versi `18.18.0` atau lebih baru (disarankan LTS v20 atau v22)
- **MySQL** yang aktif di port `3306` (bisa via XAMPP, WampServer, atau MySQL Community Server)
- **Git** untuk clone repository

---

### Langkah 1 — Clone Repository & Install

Buka terminal (PowerShell / CMD / Git Bash), lalu jalankan:

```bash
git clone https://github.com/Voncruyff/cuti-pgtk.git
cd cuti-pgtk
npm install
```

---

### Langkah 2 — Buat File Konfigurasi `.env`

Salin file contoh environment:

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Buka file `.env` dan sesuaikan isinya:

```env
NEXT_PUBLIC_APP_NAME="CUTI PGTK"
NEXT_PUBLIC_APP_DESCRIPTION="Sistem Informasi Manajemen Cuti PGTK"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Ganti 'root' dan password sesuai konfigurasi MySQL Anda
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/NAMA_DATABASE
DATABASE_URL="mysql://root:@localhost:3306/cuti_pgtk"

# String kunci rahasia JWT minimal 32 karakter
AUTH_SECRET="dev_secret_cuti_pgtk_key_32_characters_long_minimum"
COOKIE_SECURE="false"

NODE_ENV="development"
PORT=3000
HOSTNAME="0.0.0.0"
```

> **Catatan:** Jika MySQL Anda menggunakan password, ubah `mysql://root:@localhost` menjadi `mysql://root:PASSWORD@localhost`.

---

### Langkah 3 — Inisialisasi Database

Jalankan perintah berikut **secara berurutan**:

```bash
# 1. Buat semua tabel di database MySQL berdasarkan schema Prisma
npm run db:push

# 2. Regenerasi Prisma Client agar sesuai dengan schema terbaru
npm run db:generate

# 3. Isi data awal wajib (Akun Login, 5 Bagian, 28 Stasiun, Konfigurasi Otomasi)
npm run db:seed
```

Setelah seeding berhasil, akun login default yang tersedia:

| Username | Password | Role | Departemen |
| :---: | :---: | :--- | :---: |
| `admin` | `admin123` | Admin Utama (Full Access) | ALL |
| `admintuk` | `admin123` | Admin Bagian | TUK |
| `admintan` | `admin123` | Admin Bagian | TAN |
| `admintek` | `admin123` | Admin Bagian | TEK |
| `adminpab` | `admin123` | Admin Bagian | PAB |

> ⚠️ **Segera ganti password** semua akun setelah login pertama melalui menu **Pengaturan → Keamanan Akun**.

---

### Langkah 4 — Jalankan Aplikasi

```bash
npm run dev
```

Buka browser dan akses: **`http://localhost:3000`**

---

## 🏢 Deployment di Server Lokal Perusahaan (LAN / Intranet)

Jika aplikasi akan dipasang di PC Server kantor PG Trangkil agar dapat diakses seluruh staf administrasi di jaringan LAN:

### 1. Sesuaikan File `.env` untuk Mode Produksi

```env
NEXT_PUBLIC_APP_URL="http://192.168.100.20:3000"
DATABASE_URL="mysql://root:password_server@localhost:3306/cuti_pgtk"
AUTH_SECRET="kunci_rahasia_pg_trangkil_produksi_minimal_32_karakter"
COOKIE_SECURE="false"
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

> Ganti `192.168.100.20` dengan IP lokal server kantor Anda.

### 2. Buka Port di Windows Firewall

Tambahkan **Inbound Rule** port `3000` di Windows Defender Firewall server agar komputer lain di LAN dapat mengakses aplikasi.

### 3. Build & Jalankan Server Produksi

```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

### 4. Akses dari Komputer Staf

Staf administrasi cukup membuka browser dan mengakses:
```
http://192.168.100.20:3000
```

---

## 📂 Struktur File & Folder

Aplikasi menggunakan arsitektur **Feature-Sliced & Component-Driven**:

```
cuti-pgtk/
│
├── 📄 .env.example            → Template konfigurasi environment (DATABASE_URL, AUTH_SECRET, dll.)
├── 📄 next.config.mjs         → Konfigurasi Next.js (URL redirect, optimasi)
├── 📄 package.json            → Daftar dependensi & npm scripts (dev, build, seed, dll.)
├── 📄 tailwind.config.ts      → Token warna brand, font, dan border-radius kustom
├── 📄 tsconfig.json           → Konfigurasi kompilasi TypeScript
│
├── 📁 prisma/                 → Layer Basis Data
│   ├── schema.prisma          → Cetak biru struktur tabel, relasi antar-entitas, dan enum
│   └── seed.ts                → Script injeksi data awal (Akun Login, 5 Bagian, 28 Stasiun, Konfigurasi)
│
├── 📁 public/                 → Aset Statis Publik
│   ├── assets/                → Logo PG Trangkil & PT Kebon Agung
│   └── uploads/profile/       → Foto profil pengguna yang di-upload (disimpan lokal di server)
│
└── 📁 src/                    → Source Code Utama Aplikasi
    │
    ├── 📁 actions/            → Server Actions Next.js (Backend Logic & Mutasi DB)
    │   ├── aksi-autentikasi.ts  → Login (validasi bcrypt, terbitkan JWT), Logout
    │   ├── aksi-cuti.ts         → Pengajuan cuti, pemotongan saldo ledger
    │   ├── aksi-koreksi.ts      → Koreksi & pembatalan permohonan cuti
    │   ├── aksi-saldo.ts        → Penambahan saldo cuti manual perorangan
    │   ├── aksi-otomasi-saldo.ts→ Mesin otomasi: Pemberian hak tahunan, cuti besar, kedaluwarsa
    │   ├── aksi-laporan.ts      → Query data untuk laporan & rekap cetak
    │   ├── aksi-karyawan.ts     → CRUD master data karyawan (tambah, edit, hapus)
    │   ├── aksi-bagian.ts       → CRUD departemen / bagian kerja
    │   ├── aksi-stasiun.ts      → CRUD stasiun / unit kerja pabrik
    │   ├── aksi-pengguna.ts     → CRUD akun user aplikasi & penugasan role
    │   └── aksi-pengaturan.ts   → Update profil perusahaan, kebijakan cuti, keamanan akun
    │
    ├── 📁 app/                → Routing Next.js App Router
    │   ├── globals.css          → CSS global, variabel warna, dan keyframes animasi shimmer
    │   ├── layout.tsx           → Root layout aplikasi (Font, Sonner Toaster)
    │   ├── page.tsx             → Redirect otomatis ke /landingpage
    │   │
    │   ├── 📁 (auth)/login/     → Halaman login (form username & password)
    │   ├── 📁 landingpage/      → Halaman publik: info karyawan cuti hari ini
    │   │
    │   ├── 📁 (dashboard)/      → Area sistem internal (terlindungi session JWT)
    │   │   ├── layout.tsx         → Shell: Sidebar navigasi + Header atas
    │   │   ├── dashboard/         → Halaman ringkasan statistik & aktivitas terbaru
    │   │   ├── master-karyawan/   → Manajemen data karyawan PG Trangkil
    │   │   ├── master-bagian/     → Manajemen data bagian / departemen
    │   │   ├── master-stasiun/    → Manajemen data stasiun / unit kerja pabrik
    │   │   ├── ambil-cuti/        → Form pengajuan permohonan cuti karyawan
    │   │   ├── koreksi-cuti/      → Koreksi & pembatalan cuti yang sudah diajukan
    │   │   ├── tambah-saldo-cuti/ → Penambahan saldo cuti manual (Admin Utama)
    │   │   ├── rincian-cuti/      → Buku besar riwayat cuti & mutasi saldo karyawan
    │   │   ├── laporan-cuti/      → Laporan rekap cuti dengan fitur cetak A4
    │   │   ├── kelola-user/       → Manajemen akun pengguna aplikasi
    │   │   └── pengaturan/        → Sub-modul pengaturan sistem
    │   │       ├── automasi-saldo/    → Konfigurasi aturan otomasi saldo cuti
    │   │       ├── profil-perusahaan/ → Profil & identitas instansi PG Trangkil
    │   │       └── keamanan-akun/     → Ubah foto profil, nama, username & password
    │   │
    │   └── 📁 api/cron/otomasi-saldo/ → Endpoint API cron job otomasi saldo (opsional)
    │
    ├── 📁 components/         → Komponen Antarmuka Pengguna (UI)
    │   ├── bersama/             → Komponen reusable lintas modul (skeleton, stat card, dll.)
    │   ├── fitur/               → Komponen per fitur bisnis (tabel, modal, form per halaman)
    │   ├── landingpage/         → Komponen khusus halaman publik (hero, navbar, tabel, FAQ)
    │   ├── motion/              → Komponen animasi: page transition & counter angka
    │   ├── tata-letak/          → Kerangka shell: Sidebar, Header, Context sidebar
    │   └── ui/                  → Design system primitif: Button, Card, Dialog, Input, dll.
    │
    ├── 📁 lib/                → Pustaka Utilitas & Helpers
    │   ├── auth/                → Enkripsi password (bcrypt) & session JWT
    │   ├── db/prisma.ts         → Singleton instance PrismaClient
    │   ├── audit/               → Logger audit trail aksi pengguna
    │   ├── motion.ts            → Token animasi terpusat (durasi, easing, spring)
    │   ├── utils.ts             → Helper penggabungan class Tailwind (clsx + twMerge)
    │   └── validation/          → Skema validasi formulir berbasis Zod
    │
    └── 📁 types/              → Definisi Tipe TypeScript Global
        ├── auth.ts              → Tipe SessionUser, UserRole, JWT Payload
        ├── actions.ts           → Tipe ActionResult (respons server action)
        └── cuti.ts              → Tipe model data cuti, saldo, dan karyawan
```

---

## 🖥️ Fungsi Setiap Halaman

### 🌐 Halaman Publik (Tanpa Login)

#### Landing Page — `/` atau `/landingpage`
Papan informasi publik yang bisa diakses siapa saja (tanpa login) dari jaringan LAN kantor.
- Menampilkan **daftar karyawan yang sedang cuti hari ini** secara real-time
- Filter berdasarkan kategori (Pimpinan / Pelaksana) dan jenis cuti (Tahunan / Besar / Inhaldagen)
- Pencarian instan berdasarkan nama karyawan
- Pop-up detail cuti per karyawan (tanggal, bagian, keperluan)
- Tampilan statistik ringkas (total cuti hari ini, per kategori)
- Bagian FAQ pertanyaan umum seputar sistem cuti

---

### 🔐 Autentikasi

#### Login — `/login`
Gerbang masuk bagi staf administrasi dan pimpinan.
- Validasi username & password terenkripsi bcrypt
- Penerbitan token sesi JWT (disimpan sebagai HttpOnly Cookie)
- Redirect otomatis ke `/dashboard` setelah login berhasil

---

### 📊 Area Dashboard (Perlu Login)

#### Dashboard Utama — `/dashboard`
Pusat kendali yang menampilkan gambaran umum operasional cuti:
- **Kartu statistik**: Total karyawan aktif, karyawan cuti hari ini, rata-rata sisa saldo cuti
- **Grafik rekapitulasi**: Distribusi cuti per bagian / per bulan
- **Tabel aktivitas terbaru**: Daftar pengajuan atau mutasi saldo terbaru
- Filter khusus untuk **Admin Bagian** (hanya melihat data departemennya sendiri)

---

### 👥 Modul Master Data (Admin Utama)

#### Master Karyawan — `/master-karyawan`
Manajemen basis data seluruh karyawan PG Trangkil.
- Tambah, edit, hapus data karyawan (NIP, nama, jabatan, kategori, bagian, stasiun kerja, tanggal SK pengangkatan)
- Kalkulasi otomatis masa kerja berdasarkan tanggal SK
- Filter tab kategori: Pimpinan / Pelaksana
- Pencarian nama & NIP
- Cetak laporan daftar karyawan

#### Master Bagian — `/master-bagian`
Pengelolaan departemen / bagian kerja PG Trangkil.
- CRUD data bagian: kode bagian, nama bagian, nama & jabatan kepala bagian
- Status aktif / nonaktif bagian

#### Master Stasiun — `/master-stasiun`
Pengelolaan stasiun atau pos kerja dalam suatu bagian.
- CRUD data stasiun: kode KOBAG, nama NABAG, relasi ke bagian
- Status aktif / nonaktif stasiun

---

### 📋 Modul Operasional Cuti

#### Pengambilan Cuti — `/ambil-cuti`
Formulir utama pencatatan permohonan cuti karyawan.
- Pilih karyawan (cari NIP / nama)
- Pilih jenis cuti: Tahunan / Besar / Inhaldagen
- **Multi-date picker**: pilih satu atau beberapa tanggal cuti sekaligus
- Kalkulasi otomatis jumlah hari kerja (mengabaikan Sabtu, Minggu, dan hari libur nasional)
- Validasi saldo cuti tersedia sebelum menyimpan (saldo tidak bisa minus)
- Otomatis memotong saldo cuti di buku besar

#### Koreksi Cuti — `/koreksi-cuti`
Koreksi atau pembatalan transaksi cuti yang sudah diajukan.
- Batalkan cuti dan kembalikan saldo otomatis
- Edit jumlah hari atau tanggal cuti yang salah input
- Log audit tercatat untuk setiap koreksi

#### Tambah Saldo Cuti — `/tambah-saldo-cuti`
Penambahan kuota saldo cuti secara manual (hanya Admin Utama).
- Input saldo cuti Tahunan, Besar, atau Inhaldagen per karyawan
- Catatan keterangan mutasi saldo wajib diisi

#### Rincian Cuti — `/rincian-cuti`
Buku besar ledger riwayat cuti per karyawan.
- Pilih karyawan → tampil seluruh riwayat transaksi (tambah saldo & ambil cuti)
- Saldo tersisa terkini (Tahunan, Besar, Inhaldagen)
- Detail tanggal-tanggal pelaksanaan setiap cuti
- Cetak Surat Izin Cuti (2 rangkap format A4, 50:50 slip atas-bawah)

#### Laporan Cuti — `/laporan-cuti`
Modul pelaporan dan cetak rekap cuti.
- Filter periode tanggal, bagian, jenis cuti
- Tabel rekap dengan nomor urut, nama, NIP, tanggal, keperluan, jumlah hari
- **Cetak ke PDF** format kertas A4 resmi perusahaan dengan kop surat
- Nomor halaman otomatis (hanya jika lebih dari 1 halaman)

---

### ⚙️ Modul Pengelolaan Sistem

#### Kelola Pengguna — `/kelola-user`
Manajemen akun pengguna sistem SIP-CUTI (hanya Admin Utama).
- Tambah user baru dengan role dan penetapan departemen
- Edit nama, username, role, dan departemen user
- Reset password user ke password default
- Aktifkan / nonaktifkan akun user

#### Automasi Saldo — `/pengaturan/automasi-saldo`
Konfigurasi mesin otomasi pemberian hak cuti (hanya Admin Utama).
- **Cuti Tahunan**: Jumlah hari, minimal masa kerja, siklus pemberian, batas carry-over
- **Cuti Besar**: Jumlah hari, kelipatan tahun masa kerja, masa berlaku
- **Inhaldagen**: Batas masa berlaku saldo (bulan)
- Tombol eksekusi manual otomasi untuk seluruh karyawan

#### Profil Perusahaan — `/pengaturan/profil-perusahaan`
Konfigurasi identitas instansi yang muncul di kop dokumen cetak.
- Nama perusahaan, nama unit, alamat, nomor telepon, email
- Upload logo perusahaan
- Data penandatangan surat (Pimpinan & Kepala Bagian)

#### Keamanan Akun — `/pengaturan/keamanan-akun`
Pengaturan profil akun pengguna yang sedang login.
- Upload & crop foto profil (modal pemotong foto interaktif)
- Ubah nama lengkap & username
- Ganti kata sandi akun

---

## 👥 Peran Pengguna & Hak Akses (RBAC)

| Fitur / Halaman | Admin Utama | Admin Bagian |
| :--- | :---: | :---: |
| Dashboard | ✅ Semua Bagian | ✅ Bagian Sendiri |
| Master Karyawan | ✅ | ❌ |
| Master Bagian | ✅ | ❌ |
| Master Stasiun | ✅ | ❌ |
| Pengambilan Cuti | ✅ Semua Bagian | ✅ Bagian Sendiri |
| Koreksi Cuti | ✅ | ✅ Bagian Sendiri |
| Tambah Saldo | ✅ | ❌ |
| Rincian Cuti | ✅ | ✅ Bagian Sendiri |
| Laporan Cuti | ✅ Semua Bagian | ✅ Bagian Sendiri |
| Kelola Pengguna | ✅ | ❌ |
| Automasi Saldo | ✅ | ❌ |
| Profil Perusahaan | ✅ | ❌ |
| Keamanan Akun | ✅ | ✅ (akun sendiri) |
| Landing Page | ✅ Publik | ✅ Publik |

---

## 📝 Lisensi & Kepemilikan

Aplikasi ini dikembangkan untuk kebutuhan internal operasional:  
**PT Kebon Agung — Pabrik Gula Trangkil**  
Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah, Indonesia.  
*Hak cipta dilindungi undang-undang.*
