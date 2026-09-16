<div align="center">

  <p align="center">
    <img src="public/assets/PGTrangkilLogo.png" alt="Logo PG Trangkil" height="90" />
  </p>

  # SIP-CUTI PG TRANGKIL

  **Sistem Informasi Manajemen dan Pengelolaan Cuti Karyawan**  
  PT Kebon Agung — Pabrik Gula Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TSX-4.19-23272F?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TSX" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Prisma_ORM-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Zod-3.23-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
    <img src="https://img.shields.io/badge/Motion-13.2-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Motion" />
    <img src="https://img.shields.io/badge/TanStack_Table-8.20-FF4154?style=for-the-badge&logo=react-table&logoColor=white" alt="TanStack Table" />
    <img src="https://img.shields.io/badge/Lucide_Icons-0.46-F05A28?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide Icons" />
  </p>

</div>

---

## Daftar Isi

1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Technology Stack](#2-technology-stack)
3. [Prasyarat Instalasi](#3-prasyarat-instalasi)
4. [Panduan Instalasi Lokal (Development)](#4-panduan-instalasi-lokal-development)
5. [Konfigurasi Environment (.env)](#5-konfigurasi-environment-env)
6. [Inisialisasi Database](#6-inisialisasi-database)
7. [Menjalankan Aplikasi](#7-menjalankan-aplikasi)
8. [Deployment Produksi di Jaringan LAN](#8-deployment-produksi-di-jaringan-lan)
9. [Struktur Direktori dan File](#9-struktur-direktori-dan-file)
10. [Skema Database](#10-skema-database)
11. [Fungsi Setiap Modul dan Halaman](#11-fungsi-setiap-modul-dan-halaman)
12. [Server Actions (Backend Logic)](#12-server-actions-backend-logic)
13. [Peran Pengguna dan Hak Akses (RBAC)](#13-peran-pengguna-dan-hak-akses-rbac)
14. [Akun Default Setelah Seeding](#14-akun-default-setelah-seeding)
15. [Daftar Script NPM](#15-daftar-script-npm)
16. [Lisensi dan Kepemilikan](#16-lisensi-dan-kepemilikan)

---

## 1. Tentang Aplikasi

SIP-CUTI PG TRANGKIL adalah sistem informasi berbasis web yang dirancang khusus untuk mengelola seluruh proses administrasi cuti karyawan di Pabrik Gula Trangkil, PT Kebon Agung. Aplikasi ini menggantikan proses manual berbasis kertas dan spreadsheet dengan sistem digital yang terintegrasi.

Fitur utama yang disediakan:

- Pencatatan dan pengelolaan permohonan cuti karyawan (Tahunan, Besar, Inhaldagen)
- Buku besar ledger saldo cuti per karyawan
- Mesin otomasi pemberian hak cuti berdasarkan kebijakan perusahaan
- Laporan rekap cuti dengan fitur cetak format A4 berkop surat resmi
- Manajemen master data (karyawan, bagian, stasiun)
- Papan informasi publik cuti karyawan hari ini (tanpa login)
- Kontrol akses berbasis peran (Admin Utama dan Admin Bagian)

---

## 2. Technology Stack

Berikut adalah rincian ekosistem teknologi, pustaka, dan kakas yang digunakan dalam pengembangan aplikasi:

| Logo / Badge | Teknologi | Versi | Peran & Deskripsi dalam Proyek |
| :--- | :--- | :--- | :--- |
| ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white) | **Next.js** | 15.5 | Framework full-stack utama berbasis React dengan App Router, React Server Components (RSC), Turbopack compiler, dan Server Actions. |
| ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | **React** | 19.2 | Library antarmuka komponen UI modern dengan dukungan Server Component dan hooks native. |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | **TypeScript** | 5.6 | Bahasa pemrograman dengan pengetikan statis ketat (*type safety*) pada semua modul (`.ts`) dan komponen (`.tsx`). |
| ![TSX](https://img.shields.io/badge/TSX-23272F?style=flat-square&logo=typescript&logoColor=3178C6) | **TSX** | 4.19 | Runtime runner cepat untuk mengeksekusi file TypeScript secara langsung tanpa kompilasi manual (digunakan pada `prisma/seed.ts`). |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | **Tailwind CSS** | 3.4 | Framework utilitas CSS untuk tata letak antarmuka responsif (mobile/desktop), tema korporat, dan stylesheet format cetak A4. |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white) | **Prisma ORM** | 5.22 | Object-Relational Mapping (ORM) *type-safe* untuk migrasi skema, relasi relasional basis data, dan eksekusi query data. |
| ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) | **MySQL** | 8.0+ | Sistem manajemen basis data relasional (RDBMS) untuk penyimpanan persisten seluruh transaksi cuti, karyawan, dan pengguna. |
| ![Motion](https://img.shields.io/badge/Motion-0055FF?style=flat-square&logo=framer&logoColor=white) | **Motion** | 13.2 | Library animasi deklaratif untuk transisi halaman yang halus, dialog modal, dropdown, dan animasi angka (*animated counter*). |
| ![TanStack Table](https://img.shields.io/badge/TanStack_Table-FF4154?style=flat-square&logo=react-table&logoColor=white) | **TanStack Table** | 8.20 | Headless data-table library untuk penyaringan multi-kolom, pencarian instan, pengurutan, dan paginasi data tabel karyawan & cuti. |
| ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) | **Zod** | 3.23 | Validasi skema data (*schema validation*) pada input formulir di sisi klien serta validasi payload pada Server Actions. |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white) | **React Hook Form** | 7.53 | Pengelolaan *state* form performa tinggi tanpa re-render yang tidak perlu, terintegrasi penuh dengan validator Zod. |
| ![JWT Jose](https://img.shields.io/badge/JOSE_JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | **Jose & bcryptjs** | 5.9 / 2.4 | Mekanisme autentikasi JWT mandiri disimpan dalam HttpOnly Secure Cookie, dan enkripsi hash kata sandi satu arah (*bcrypt*). |
| ![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-F05A28?style=flat-square&logo=lucide&logoColor=white) | **Lucide React** | 0.46 | Kumpulan ikon SVG konsisten dan ringan untuk seluruh elemen antarmuka dan navigasi sistem. |
| ![Sonner](https://img.shields.io/badge/Sonner_Toast-000000?style=flat-square&logo=firefoxbrowser&logoColor=white) | **Sonner** | 1.7 | Komponen notifikasi toast mengambang yang responsif untuk feedback operasi CRUD dan status server. |
| ![Date-fns](https://img.shields.io/badge/date--fns-770C56?style=flat-square&logo=javascript&logoColor=white) | **date-fns** | 4.1 | Utilitas manipulasi tanggal untuk penghitungan masa kerja, durasi hak cuti, selisih hari, dan format kalender Indonesia. |
| ![React Easy Crop](https://img.shields.io/badge/React_Easy_Crop-282C34?style=flat-square&logo=react&logoColor=61DAFB) | **react-easy-crop** | 6.2 | Utilitas interaktif pemotongan foto profil karyawan sebelum disimpan ke direktori upload server. |


---

## 3. Prasyarat Instalasi

Pastikan semua perangkat lunak berikut sudah terpasang dan berjalan di komputer sebelum memulai instalasi:

| Perangkat Lunak | Versi Minimum | Keterangan |
| :--- | :--- | :--- |
| Node.js | 18.18.0 (LTS v20 atau v22 disarankan) | Runtime JavaScript |
| npm | Mengikuti versi Node.js | Package manager (sudah termasuk dalam Node.js) |
| MySQL | 8.0 | Server basis data, dapat menggunakan XAMPP, WampServer, atau MySQL Community Server |
| Git | Versi terbaru | Untuk mengunduh kode sumber dari repository |

Pastikan layanan MySQL aktif dan berjalan di port `3306` sebelum melanjutkan ke langkah instalasi.

---

## 4. Panduan Instalasi Lokal (Development)

### Langkah 1 — Clone Repository

Buka terminal (PowerShell, Command Prompt, atau Git Bash), kemudian jalankan perintah berikut:

```bash
git clone https://github.com/Voncruyff/cuti-pgtk.git
cd cuti-pgtk
```

### Langkah 2 — Install Dependensi

```bash
npm install
```

Perintah ini akan mengunduh dan memasang seluruh paket yang dibutuhkan sesuai daftar di `package.json`. Proses ini memerlukan koneksi internet dan dapat memakan waktu beberapa menit tergantung kecepatan jaringan.

---

## 5. Konfigurasi Environment (.env)

### Langkah 3 — Salin File Template Environment

```bash
# Windows (Command Prompt / PowerShell)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

### Langkah 4 — Edit File `.env`

Buka file `.env` menggunakan teks editor (VS Code, Notepad++, atau sejenisnya), lalu sesuaikan setiap variabelnya:

```env
# ==============================================================================
# KONFIGURASI APLIKASI
# ==============================================================================

# Nama aplikasi yang ditampilkan di antarmuka
NEXT_PUBLIC_APP_NAME="CUTI PGTK"

# Deskripsi singkat aplikasi
NEXT_PUBLIC_APP_DESCRIPTION="Sistem Informasi Manajemen Cuti PGTK"

# Versi aplikasi
NEXT_PUBLIC_APP_VERSION="1.0.0"

# URL dasar aplikasi — sesuaikan dengan alamat akses
NEXT_PUBLIC_APP_URL="http://localhost:3000"


# ==============================================================================
# KONEKSI DATABASE (MySQL)
# ==============================================================================
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/NAMA_DATABASE
# Tanpa password : mysql://root:@localhost:3306/cuti_pgtk
# Dengan password: mysql://root:password123@localhost:3306/cuti_pgtk
DATABASE_URL="mysql://root:@localhost:3306/cuti_pgtk"

# Parameter terpisah (untuk dokumentasi atau script backup)
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="cuti_pgtk"
DB_USER="root"
DB_PASSWORD=""


# ==============================================================================
# AUTENTIKASI
# ==============================================================================
# Kunci rahasia untuk enkripsi token sesi JWT — wajib minimal 32 karakter acak
AUTH_SECRET="ganti_dengan_kunci_rahasia_acak_minimal_32_karakter"

# Wajib "false" jika aplikasi diakses via HTTP (jaringan lokal / LAN)
# Ubah ke "true" hanya jika menggunakan HTTPS
COOKIE_SECURE="false"


# ==============================================================================
# ENVIRONMENT DAN SERVER
# ==============================================================================
# "development" = Mode pengembangan (fitur demo aktif)
# "production"  = Mode produksi (keamanan penuh, fitur demo dinonaktifkan)
NODE_ENV="development"

# Port yang digunakan server
PORT=3000

# Binding agar server dapat diakses dari komputer lain di jaringan LAN
HOSTNAME="0.0.0.0"
```

> **Catatan Penting:**
> - Nilai `AUTH_SECRET` harus minimal 32 karakter dengan karakter acak yang kuat.
> - Jika MySQL menggunakan password, isi `DB_PASSWORD` dan sesuaikan format `DATABASE_URL`.
> - Nama database `cuti_pgtk` akan dibuat secara otomatis saat menjalankan `npm run db:push`.

---

## 6. Inisialisasi Database

### Langkah 5 — Jalankan Perintah Database Secara Berurutan

Jalankan ketiga perintah berikut **secara berurutan**. Tunggu setiap perintah hingga selesai sebelum menjalankan perintah berikutnya:

```bash
# Langkah 5a — Buat semua tabel di database MySQL berdasarkan skema Prisma.
# Jika database "cuti_pgtk" belum ada, perintah ini akan membuatnya.
npm run db:push

# Langkah 5b — Regenerasi Prisma Client agar sinkron dengan skema terbaru.
npm run db:generate

# Langkah 5c — Isi data awal yang wajib ada:
# akun pengguna default, 5 bagian, 28 stasiun, dan konfigurasi otomasi saldo.
npm run db:seed
```

> **Catatan:** Perintah `db:push` memerlukan MySQL aktif. Jika muncul error koneksi, periksa kembali nilai `DATABASE_URL` di file `.env` dan pastikan layanan MySQL sudah berjalan.

---

## 7. Menjalankan Aplikasi

### Langkah 6 — Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan menggunakan Turbopack (mode cepat). Buka browser dan akses:

```
http://localhost:3000
```

Aplikasi akan otomatis mengarahkan ke halaman landing page publik. Untuk masuk ke sistem administrasi, akses halaman login di:

```
http://localhost:3000/login
```

---

## 8. Deployment Produksi di Jaringan LAN

Panduan ini digunakan jika aplikasi akan dipasang di komputer server kantor agar dapat diakses oleh seluruh staf administrasi melalui jaringan intranet PG Trangkil.

### Langkah 1 — Sesuaikan File `.env` untuk Mode Produksi

```env
# Ganti dengan IP lokal komputer server
# Cek IP dengan membuka Command Prompt, ketik: ipconfig
# Lihat nilai IPv4 Address pada adapter jaringan yang aktif
NEXT_PUBLIC_APP_URL="http://192.168.100.20:3000"

DATABASE_URL="mysql://root:PASSWORD_SERVER@localhost:3306/cuti_pgtk"

# Gunakan kunci rahasia yang kuat dan unik untuk produksi
AUTH_SECRET="kunci_rahasia_pg_trangkil_produksi_minimal_32_karakter"

COOKIE_SECURE="false"
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

### Langkah 2 — Izinkan Port di Windows Firewall

Tambahkan aturan Inbound Rule untuk port `3000` pada Windows Defender Firewall di komputer server agar komputer lain di jaringan LAN dapat mengaksesnya.

Cara cepat via PowerShell (jalankan sebagai Administrator):

```powershell
New-NetFirewallRule -DisplayName "SIP-CUTI Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Langkah 3 — Build dan Jalankan Server Produksi

```bash
# Build aplikasi untuk produksi
npm run build

# Jalankan server produksi
npm run start
```

### Langkah 4 — Akses dari Komputer Staf

Staf administrasi cukup membuka browser di komputer masing-masing dan mengakses:

```
http://192.168.100.20:3000
```

> **Catatan:** Agar server tetap berjalan meskipun terminal atau sesi RDP ditutup, gunakan process manager **PM2**:
>
> ```bash
> npm install -g pm2
> pm2 start npm --name "sip-cuti" -- run start
> pm2 startup
> pm2 save
> ```

---

## 9. Struktur Direktori dan File

Aplikasi menggunakan arsitektur **Feature-Sliced** dengan pendekatan **Component-Driven Development** di atas Next.js App Router.

```
cuti-pgtk/
│
├── .env.example              # Template variabel environment (referensi konfigurasi)
├── .env                      # File konfigurasi aktif (JANGAN di-commit ke Git)
├── .gitignore                # File dan folder yang diabaikan oleh Git
├── .dockerignore             # File yang diabaikan saat build Docker image
├── Dockerfile                # Konfigurasi untuk build Docker container
├── docker-compose.yml        # Orkestrasi multi-container (app + database)
├── docker-entrypoint.sh      # Script entrypoint untuk container Docker
├── next.config.mjs           # Konfigurasi Next.js (URL, redirect, optimasi gambar)
├── package.json              # Daftar dependensi dan npm scripts
├── tailwind.config.ts        # Konfigurasi Tailwind CSS (warna brand, font, spacing)
├── tsconfig.json             # Konfigurasi kompilasi TypeScript
├── postcss.config.mjs        # Konfigurasi PostCSS (digunakan Tailwind)
│
├── prisma/
│   ├── schema.prisma         # Definisi model tabel, relasi, dan enum database
│   └── seed.ts               # Script untuk mengisi data awal wajib ke database
│
├── public/
│   ├── assets/               # Logo PG Trangkil dan PT Kebon Agung
│   └── uploads/
│       └── profile/          # Foto profil pengguna yang di-upload (disimpan di server)
│
└── src/
    │
    ├── actions/              # Server Actions Next.js — Backend Logic dan Mutasi Database
    │   ├── aksi-autentikasi.ts
    │   ├── aksi-cuti.ts
    │   ├── aksi-koreksi.ts
    │   ├── aksi-saldo.ts
    │   ├── aksi-otomasi-saldo.ts
    │   ├── aksi-laporan.ts
    │   ├── aksi-karyawan.ts
    │   ├── aksi-bagian.ts
    │   ├── aksi-stasiun.ts
    │   ├── aksi-pengguna.ts
    │   └── aksi-pengaturan.ts
    │
    ├── app/                  # Routing Next.js App Router
    │   ├── globals.css       # CSS global, variabel warna, dan keyframes animasi
    │   ├── layout.tsx        # Root layout aplikasi (Font loader, Sonner Toaster)
    │   ├── loading.tsx       # Tampilan loading root-level
    │   ├── page.tsx          # Entry point — redirect otomatis ke /landingpage
    │   │
    │   ├── (auth)/
    │   │   └── login/        # Halaman login
    │   │
    │   ├── landingpage/      # Halaman publik: daftar karyawan cuti hari ini
    │   │
    │   ├── (dashboard)/      # Area terproteksi — wajib login
    │   │   ├── layout.tsx    # Shell layout: Sidebar + Header atas
    │   │   ├── loading.tsx   # Skeleton loading untuk area dashboard
    │   │   ├── dashboard/
    │   │   ├── master-karyawan/
    │   │   ├── master-bagian/
    │   │   ├── master-stasiun/
    │   │   ├── ambil-cuti/
    │   │   ├── koreksi-cuti/
    │   │   ├── tambah-saldo-cuti/
    │   │   ├── rincian-cuti/
    │   │   ├── laporan-cuti/
    │   │   ├── kelola-user/
    │   │   └── pengaturan/
    │   │       ├── layout.tsx
    │   │       ├── page.tsx          # Redirect ke sub-modul pengaturan
    │   │       ├── automasi-saldo/
    │   │       ├── profil-perusahaan/
    │   │       ├── penandatangan/    # Manajemen data penandatangan surat
    │   │       └── keamanan-akun/
    │   │
    │   ├── api/
    │   │   └── cron/
    │   │       └── otomasi-saldo/    # Endpoint API cron job otomasi saldo (opsional)
    │   │
    │   └── uploads/                  # Route handler untuk serving file upload
    │
    ├── components/
    │   ├── bersama/          # Komponen reusable lintas modul (skeleton, stat card)
    │   ├── fitur/            # Komponen per fitur bisnis (tabel, modal, form per halaman)
    │   ├── landingpage/      # Komponen khusus halaman publik (hero, navbar, tabel, FAQ)
    │   ├── motion/           # Komponen animasi: page transition dan counter angka
    │   ├── tata-letak/       # Kerangka shell: Sidebar, Header, Context sidebar
    │   └── ui/               # Design system primitif: Button, Card, Dialog, Input, dll.
    │
    ├── lib/
    │   ├── auth/
    │   │   ├── session.ts             # Pembuatan, pembacaan, dan penghapusan sesi JWT
    │   │   └── department-checker.ts  # Validasi akses berdasarkan departemen user
    │   ├── db/
    │   │   └── prisma.ts              # Singleton instance PrismaClient
    │   ├── audit/                     # Logger audit trail aksi pengguna
    │   ├── utils/                     # Helper utilitas tambahan
    │   ├── validation/                # Skema validasi formulir berbasis Zod
    │   ├── motion.ts                  # Token animasi terpusat (durasi, easing, spring)
    │   ├── utils.ts                   # Helper penggabungan class Tailwind (clsx + twMerge)
    │   └── header-loading.ts          # Utilitas header loading state
    │
    └── types/
        ├── auth.ts           # Tipe SessionUser, UserRole, JWT Payload
        ├── actions.ts        # Tipe ActionResult (standar respons server action)
        └── cuti.ts           # Tipe model data cuti, saldo, dan karyawan
```

---

## 10. Skema Database

Berikut adalah model-model utama dalam database aplikasi berdasarkan `prisma/schema.prisma`:

| Model | Nama Tabel | Keterangan |
| :--- | :--- | :--- |
| `User` | `users` | Akun pengguna sistem (Admin Utama / Admin Bagian) |
| `Department` | `bagian` | Master data bagian / departemen kerja |
| `Station` | `stasiun` | Master data stasiun / unit kerja dalam suatu bagian |
| `Employee` | `karyawan` | Master data karyawan PG Trangkil |
| `LeaveBalance` | `saldo_cuti` | Saldo cuti aktif per karyawan (Tahunan, Besar, Inhaldagen) |
| `BalanceActivity` | `aktivitas_saldo` | Ledger seluruh transaksi cuti dan penambahan saldo |
| `OtomasiSaldoCuti` | `otomasi_saldo_cuti` | Konfigurasi aturan otomasi pemberian hak cuti |
| `ProfilPerusahaan` | `profil_perusahaan` | Identitas instansi untuk kop dokumen cetak |
| `Penandatanganan` | `penandatanganan` | Data penandatangan surat cuti per bagian |

**Relasi Antar-Tabel:**

```
Department (bagian)
    |-- memiliki banyak --> Station (stasiun)
    |-- memiliki banyak --> Penandatanganan

Station (stasiun)
    |-- memiliki banyak --> Employee (karyawan)

Employee (karyawan)
    |-- memiliki satu   --> LeaveBalance (saldo_cuti)
    |-- memiliki banyak --> BalanceActivity (aktivitas_saldo)
```

---

## 11. Fungsi Setiap Modul dan Halaman

### 11.1 Halaman Publik (Tanpa Login)

#### Landing Page — `/landingpage`

Papan informasi publik yang dapat diakses siapa saja dari jaringan LAN kantor tanpa memerlukan login.

- Menampilkan daftar karyawan yang sedang cuti pada hari berjalan secara real-time
- Filter berdasarkan kategori karyawan (Pimpinan / Pelaksana) dan jenis cuti (Tahunan / Besar / Inhaldagen)
- Pencarian cepat berdasarkan nama karyawan
- Pop-up detail cuti per karyawan (tanggal pelaksanaan, bagian, keperluan)
- Statistik ringkas: total karyawan cuti hari ini dan rincian per kategori
- Bagian FAQ pertanyaan umum seputar sistem cuti

---

### 11.2 Autentikasi

#### Login — `/login`

Halaman masuk bagi staf administrasi dan pimpinan.

- Formulir input username dan password
- Validasi password menggunakan enkripsi bcrypt
- Penerbitan token sesi JWT yang disimpan sebagai HttpOnly Cookie (tidak dapat diakses JavaScript di browser)
- Redirect otomatis ke `/dashboard` setelah login berhasil
- Redirect otomatis ke `/landingpage` jika pengguna yang belum login mencoba mengakses halaman terproteksi

---

### 11.3 Dashboard Utama — `/dashboard`

Pusat kendali yang menampilkan gambaran umum kondisi operasional cuti.

- Kartu statistik: total karyawan aktif, jumlah karyawan cuti hari ini, rata-rata sisa saldo cuti
- Grafik rekapitulasi: distribusi pengambilan cuti per bagian dan per bulan
- Tabel aktivitas terbaru: daftar pengajuan atau mutasi saldo terbaru
- Admin Bagian hanya melihat data dari departemennya sendiri; Admin Utama melihat seluruh bagian

---

### 11.4 Modul Master Data (Khusus Admin Utama)

#### Master Karyawan — `/master-karyawan`

Pengelolaan basis data seluruh karyawan PG Trangkil.

- Tambah, edit, dan hapus data karyawan
- Data yang dikelola: NIP, nama lengkap, jabatan, kategori (Pimpinan / Pelaksana), bagian, stasiun kerja, tanggal SK pengangkatan
- Kalkulasi otomatis masa kerja berdasarkan tanggal SK pengangkatan
- Tab filter berdasarkan kategori: Pimpinan / Pelaksana
- Pencarian berdasarkan nama atau NIP
- Cetak daftar karyawan

#### Master Bagian — `/master-bagian`

Pengelolaan data departemen atau bagian kerja.

- Tambah, edit, dan hapus data bagian
- Data yang dikelola: kode bagian, nama bagian, nama kepala bagian, jabatan kepala bagian
- Pengaturan status aktif atau nonaktif per bagian

#### Master Stasiun — `/master-stasiun`

Pengelolaan data stasiun atau pos kerja di dalam suatu bagian.

- Tambah, edit, dan hapus data stasiun
- Data yang dikelola: kode stasiun (KOBAG), nama stasiun (NABAG), relasi ke bagian induk
- Pengaturan status aktif atau nonaktif per stasiun

---

### 11.5 Modul Operasional Cuti

#### Pengambilan Cuti — `/ambil-cuti`

Formulir utama pencatatan permohonan cuti karyawan.

- Pencarian karyawan berdasarkan NIP atau nama
- Pilihan jenis cuti: Tahunan, Besar, atau Inhaldagen
- Multi-date picker: pemilihan satu atau beberapa tanggal cuti sekaligus dalam satu formulir
- Kalkulasi otomatis jumlah hari kerja efektif (Sabtu, Minggu, dan hari libur nasional tidak dihitung)
- Validasi saldo cuti tersedia sebelum menyimpan — saldo tidak dapat menjadi negatif
- Pemotongan saldo cuti secara otomatis ke buku besar saat data disimpan
- Input keperluan atau keterangan cuti

#### Koreksi Cuti — `/koreksi-cuti`

Modul untuk memperbaiki atau membatalkan transaksi cuti yang sudah tercatat.

- Pembatalan cuti: saldo yang sebelumnya dipotong akan dikembalikan secara otomatis
- Edit jumlah hari atau daftar tanggal cuti yang salah input
- Setiap tindakan koreksi dicatat dalam log audit trail

#### Tambah Saldo Cuti — `/tambah-saldo-cuti`

Penambahan kuota saldo cuti secara manual. Hanya dapat diakses oleh Admin Utama.

- Input penambahan saldo untuk jenis cuti Tahunan, Besar, atau Inhaldagen per karyawan
- Kolom keterangan mutasi saldo wajib diisi sebagai dokumentasi

#### Rincian Cuti — `/rincian-cuti`

Buku besar ledger riwayat cuti lengkap per karyawan.

- Pilih karyawan untuk menampilkan seluruh riwayat transaksi (penambahan saldo dan pengambilan cuti)
- Informasi saldo tersisa terkini untuk setiap jenis cuti (Tahunan, Besar, Inhaldagen)
- Detail tanggal-tanggal pelaksanaan setiap transaksi cuti
- Cetak Surat Izin Cuti format A4 dua rangkap (layout 50:50 slip atas-bawah)

#### Laporan Cuti — `/laporan-cuti`

Modul pelaporan dan cetak rekap cuti untuk keperluan dokumentasi resmi.

- Filter data berdasarkan periode tanggal, bagian, dan jenis cuti
- Tabel rekap berisi: nomor urut, nama karyawan, NIP, tanggal cuti, keperluan, jumlah hari
- Cetak ke PDF atau printer dalam format kertas A4 dengan kop surat resmi perusahaan
- Nomor halaman otomatis jika rekap melebihi satu halaman

---

### 11.6 Modul Pengelolaan Sistem

#### Kelola Pengguna — `/kelola-user`

Manajemen akun pengguna sistem SIP-CUTI. Hanya dapat diakses oleh Admin Utama.

- Tambah akun pengguna baru dengan penetapan peran (ADMIN_UTAMA / ADMIN_BAGIAN) dan departemen
- Edit nama lengkap, username, peran, dan departemen pengguna
- Reset password pengguna ke password default
- Aktifkan atau nonaktifkan akun pengguna

#### Automasi Saldo — `/pengaturan/automasi-saldo`

Konfigurasi mesin otomasi pemberian hak cuti berdasarkan kebijakan perusahaan. Hanya dapat diakses oleh Admin Utama.

- **Cuti Tahunan**: jumlah hari yang diberikan, minimal masa kerja yang dipersyaratkan, siklus pemberian (per tahun), batas maksimal carry-over saldo ke tahun berikutnya
- **Cuti Besar**: jumlah hari yang diberikan, kelipatan tahun masa kerja sebagai syarat, masa berlaku saldo
- **Inhaldagen**: batas masa berlaku saldo dalam satuan bulan
- Tombol eksekusi manual untuk menjalankan proses otomasi saldo secara langsung tanpa menunggu jadwal cron

#### Profil Perusahaan — `/pengaturan/profil-perusahaan`

Konfigurasi identitas instansi yang tampil pada kop dokumen cetak resmi.

- Nama perusahaan induk dan nama unit (contoh: PT Kebon Agung — Pabrik Gula Trangkil)
- Alamat lengkap, nomor telepon, dan email
- Upload logo perusahaan

#### Penandatangan — `/pengaturan/penandatangan`

Konfigurasi data penandatangan yang tercantum pada dokumen Surat Izin Cuti.

- Pengaturan penandatangan tingkat Pimpinan (berlaku untuk semua bagian)
- Pengaturan penandatangan tingkat Bagian (Kepala Bagian per departemen)
- Data yang dikelola: nama lengkap dan jabatan penandatangan

#### Keamanan Akun — `/pengaturan/keamanan-akun`

Pengaturan profil akun pengguna yang sedang aktif login.

- Upload dan crop foto profil menggunakan modal pemotong foto interaktif
- Ubah nama lengkap dan username
- Ganti kata sandi akun aktif

---

## 12. Server Actions (Backend Logic)

Seluruh logika bisnis dan operasi database diimplementasikan sebagai Next.js Server Actions di direktori `src/actions/`. Berikut peran masing-masing file:

| File | Fungsi |
| :--- | :--- |
| `aksi-autentikasi.ts` | Proses login (verifikasi password bcrypt, penerbitan JWT) dan logout (penghapusan cookie sesi) |
| `aksi-cuti.ts` | Pengajuan permohonan cuti baru, pemotongan saldo ledger, kalkulasi hari kerja efektif |
| `aksi-koreksi.ts` | Koreksi dan pembatalan transaksi cuti yang sudah tercatat, pengembalian saldo otomatis |
| `aksi-saldo.ts` | Penambahan saldo cuti manual per karyawan oleh Admin Utama |
| `aksi-otomasi-saldo.ts` | Mesin otomasi: distribusi hak cuti tahunan, cuti besar berdasarkan masa kerja, kedaluwarsa saldo |
| `aksi-laporan.ts` | Query dan agregasi data untuk keperluan laporan dan cetak rekap |
| `aksi-karyawan.ts` | CRUD master data karyawan (tambah, edit, nonaktifkan, hapus) |
| `aksi-bagian.ts` | CRUD master data bagian / departemen |
| `aksi-stasiun.ts` | CRUD master data stasiun / unit kerja pabrik |
| `aksi-pengguna.ts` | CRUD akun pengguna sistem, penetapan peran, dan reset password |
| `aksi-pengaturan.ts` | Pembaruan profil perusahaan, data penandatangan, konfigurasi otomasi, dan keamanan akun |

---

## 13. Peran Pengguna dan Hak Akses (RBAC)

Sistem menggunakan dua peran pengguna dengan batasan akses yang berbeda:

| Fitur / Halaman | Admin Utama | Admin Bagian | Keterangan Batasan Akses |
| :--- | :---: | :---: | :--- |
| Dashboard | Semua Bagian | Bagian Sendiri | Statistik dan aktivitas cuti disaring per departemen untuk Admin Bagian |
| Master Karyawan | Akses Penuh | Tidak Ada Akses | Manajemen data pegawai hanya oleh Admin Utama |
| Master Bagian | Akses Penuh | Tidak Ada Akses | Pengelolaan struktur departemen pabrik |
| Master Stasiun | Akses Penuh | Tidak Ada Akses | Pengelolaan data stasiun kerja per bagian |
| Pengambilan Cuti | Semua Bagian | Bagian Sendiri | Form pengajuan cuti dan pemotongan saldo |
| Koreksi Cuti | Semua Bagian | Bagian Sendiri | Pembatalan transaksi cuti dan pengembalian saldo |
| Tambah Saldo Cuti | Akses Penuh | Tidak Ada Akses | Injeksi saldo cuti tahunan/besar/tambahan manual |
| Rincian Cuti | Semua Bagian | Bagian Sendiri | Buku besar ledger saldo dan histori cuti karyawan |
| Laporan Cuti | Semua Bagian | Bagian Sendiri | Rekapitulasi permohonan cuti dan cetak format A4 |
| Kelola Pengguna | Akses Penuh | Tidak Ada Akses | Admin Utama dapat membuat, mengedit profil/role/bagian, memblokir, serta **mereset password seluruh akun Admin Bagian** |
| Automasi Saldo | Akses Penuh | Tidak Ada Akses | Konfigurasi kebijakan hak cuti tahunan/besar dan eksekusi manual |
| Profil Perusahaan | Akses Penuh | Tidak Ada Akses | Pengaturan data instansi dan kop surat cetak |
| Penandatangan | Akses Penuh | Tidak Ada Akses | Konfigurasi pejabat penandatangan Pimpinan dan Kepala Bagian |
| Keamanan Akun | Akun Sendiri | Akun Sendiri | Khusus mengatur foto profil, identitas, dan ganti sandi akun yang **sedang aktif login** |
| Landing Page | Publik (Tanpa Login) | Publik (Tanpa Login) | Papan informasi publik karyawan yang cuti hari ini |

**Keterangan:**

- **Admin Utama** memiliki hak akses tertinggi ke seluruh fitur dan data lintas bagian, termasuk wewenang penuh mengelola data serta **mereset kata sandi akun Admin Bagian** melalui menu **Kelola Pengguna** (`/kelola-user`).
- **Admin Bagian** hanya dapat mengakses dan mengelola data karyawan yang berada di bawah departemennya sendiri sesuai nilai `department` yang ditetapkan pada akun pengguna.
- Menu **Keamanan Akun** (`/pengaturan/keamanan-akun`) merupakan pengaturan profil mandiri untuk akun siapa pun yang sedang aktif masuk ke sistem saat itu.

---

## 14. Akun Default Setelah Seeding

Setelah menjalankan `npm run db:seed`, akun-akun berikut tersedia untuk login pertama kali:

| Username | Password | Peran | Departemen |
| :---: | :---: | :--- | :---: |
| `admin` | `admin123` | Admin Utama (Akses Penuh ke Semua Bagian) | Semua |
| `admintuk` | `admin123` | Admin Bagian | TUK |
| `admintan` | `admin123` | Admin Bagian | TAN |
| `admintek` | `admin123` | Admin Bagian | TEK |
| `adminpab` | `admin123` | Admin Bagian | PAB |

> **Peringatan Keamanan:** Ganti password semua akun segera setelah login pertama kali melalui menu **Pengaturan > Keamanan Akun**. Jangan biarkan akun dengan password default aktif di lingkungan produksi.

---

## 15. Daftar Script NPM

Semua perintah dijalankan dari direktori root proyek (`cuti-pgtk/`):

| Perintah | Keterangan |
| :--- | :--- |
| `npm run dev` | Menjalankan development server dengan Turbopack (mode cepat, disarankan untuk pengembangan) |
| `npm run dev:webpack` | Menjalankan development server dengan Webpack (alternatif jika Turbopack bermasalah) |
| `npm run build` | Mengompilasi aplikasi untuk mode produksi |
| `npm run start` | Menjalankan server produksi setelah proses build selesai |
| `npm run lint` | Menjalankan ESLint untuk memeriksa kualitas dan konsistensi kode |
| `npm run clean` | Menghapus cache build (`.next`) dan cache Node.js — berguna jika terjadi error build yang tidak wajar |
| `npm run db:push` | Mendorong skema Prisma ke database MySQL (membuat atau memperbarui tabel tanpa migrasi) |
| `npm run db:generate` | Meregenerasi Prisma Client agar sinkron dengan skema terbaru |
| `npm run db:migrate` | Membuat dan menjalankan file migrasi database (untuk tracking perubahan skema secara permanen) |
| `npm run db:seed` | Mengisi data awal wajib ke database: akun, bagian, stasiun, dan konfigurasi otomasi |

---

## 16. Lisensi dan Kepemilikan

Aplikasi ini dikembangkan untuk memenuhi kebutuhan operasional internal:

**PT Kebon Agung — Pabrik Gula Trangkil**  
Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah, Indonesia

Seluruh hak cipta dilindungi. Dilarang mendistribusikan, memodifikasi, atau menggunakan aplikasi ini untuk keperluan di luar lingkungan PT Kebon Agung tanpa izin tertulis dari pihak yang berwenang.
