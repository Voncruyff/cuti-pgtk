# Aplikasi Cuti Karyawan Pimpinan PG Trangkil

Aplikasi web internal modern untuk pengelolaan cuti karyawan pimpinan Pabrik Gula (PG) Trangkil Pati, menggantikan aplikasi legacy dengan teknologi web modern berbasis Next.js App Router, TypeScript, Tailwind CSS, MySQL, dan Prisma ORM.

---

## 📌 Fitur Utama & Prinsip Sistem

1. **Ledger-Based Leave Balance**: Sumber kebenaran saldo cuti berasal dari mutasi transaksi (`LeaveTransaction`), bukan satu kolom mutable.
2. **Master Jenis Cuti**: Mendukung Cuti Tahunan (`ANNUAL`), Cuti Besar (`LONG_LEAVE`), dan Inhaldagen (`INHALDAGEN`).
3. **Multi-Type Leave Request**: Satu permohonan cuti dapat memotong beberapa jenis cuti sekaligus.
4. **Autentikasi & Autorisasi**: Berbasis username dan password dengan proteksi role (`ADMIN`, `OPERATOR`, `VIEWER`).
5. **Audit Trail Lengkap**: Seluruh mutasi saldo, login, perubahan master data, pembatalan, dan pencetakan formulir tercatat di audit log.
6. **Formulir Permohonan Cuti**: Layout cetak standar dokumen fisik perusahaan A4 (mendukung 2 copy per lembar).

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
* **Bahasa:** TypeScript (Strict)
* **Styling:** Tailwind CSS + shadcn/ui
* **Database:** MySQL
* **ORM:** Prisma ORM
* **Autentikasi:** Secure Cookie Session + JWT (`jose`) + Password Hashing (`bcryptjs`)
* **Validasi:** Zod + React Hook Form
* **Ikon:** Lucide React
* **Tabel & Tanggal:** TanStack Table & date-fns

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
* Node.js v18.18+ / v20+
* MySQL Server (XAMPP / MySQL Community Server)

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cuti-pgtk
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan koneksi database MySQL pada `.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/cuti_pgtk"
AUTH_SECRET="dev_secret_cuti_pgtk_key_32_characters_long_minimum"
NODE_ENV="development"
```

### 4. Database Setup & Seeding
Pastikan database MySQL `cuti_pgtk` telah dibuat atau izinkan Prisma membuatnya otomatis:
```bash
# Push schema ke database MySQL
npx prisma db push

# Atau buat migrasi
npx prisma migrate dev --name init

# Jalankan Seeding data awal
npm run db:seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser pada [http://localhost:3000](http://localhost:3000).

---

## 🔑 Kredensial Akun Pengujian (Development Only)

| Username | Password | Role | Keterangan |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | `ADMIN` | Akses penuh seluruh master data, transaksi, audit log, override, dan pengaturan |
| **operator** | `operator123` | `OPERATOR` | Akses operasional cuti, pencarian karyawan, rincian, tambah saldo, dan cetak |
| **viewer** | `viewer123` | `VIEWER` | Akses read-only untuk melihat saldo dan rekap |

---

## 📁 Struktur Direktori

```text
cuti-pgtk/
├── docs/
│   ├── prd.md                     # Product Requirements Document
│   └── style-guide.md             # Style Guide & UI Design System
├── prisma/
│   ├── schema.prisma              # Schema Prisma MySQL (12 Model)
│   └── seed.ts                    # Script seeder development
├── src/
│   ├── actions/                   # Server Actions (auth, leave, employees, dll)
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/login/          # Halaman Login
│   │   ├── (dashboard)/           # Layout shell & halaman dashboard
│   │   ├── globals.css            # Tema & utility CSS
│   │   └── layout.tsx             # Root layout & Toaster
│   ├── components/
│   │   ├── layout/                # Sidebar, Topbar, AppShell
│   │   └── ui/                    # Komponen UI (Button, Card, Table, dll)
│   ├── lib/
│   │   ├── audit/                 # Centralized Audit Logger
│   │   ├── auth/                  # Session management & role checks
│   │   ├── db/                    # Prisma client singleton
│   │   ├── validation/            # Schema validasi Zod
│   │   └── utils.ts               # Helper format tanggal & angka
│   └── types/                     # TypeScript Domain & Auth types
├── ANTIGRAVITY_PROMPT.md          # Master prompt instruksi
└── package.json
```

---

## 🏗️ Production Build & Deployment

Aplikasi dirancang untuk dijalankan pada server internal perusahaan (on-premise LAN/WLAN).

```bash
# 1. Build bundle produksi
npm run build

# 2. Jalankan aplikasi produksi
npm run start
```

### Rekomendasi Arsitektur Server Internal:
```text
Browser Klien (PC Operator/Pimpinan)
          │
          ▼ (LAN / WLAN)
Reverse Proxy (IIS / Nginx Port 80/443)
          │
          ▼ (localhost:3000)
Next.js Production Service
          │
          ▼
MySQL Database (Port 3306)
```
