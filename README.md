# SIP-CUTI PG TRANGKIL
### Sistem Informasi Manajemen & Pengelolaan Cuti Karyawan
**PT Kebon Agung — Pabrik Gula Trangkil, Pati, Jawa Tengah**

Aplikasi internal berbasis web modern untuk digitalisasi pengelolaan cuti karyawan (Pimpinan & Pelaksana) di lingkungan PT Kebon Agung - PG Trangkil. Dibangun menggunakan arsitektur **Next.js 15 App Router**, **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **MySQL**, serta sistem animasi mikro berstandar **60fps.design**.

---

## 📑 DAFTAR ISI
1. [Katalog & Deskripsi Fungsi Halaman](#-katalog--deskripsi-fungsi-halaman)
2. [Arsitektur & Struktur Direktori Proyek](#-arsitektur--struktur-direktori-proyek)
3. [Peran Pengguna & Hak Akses (RBAC)](#-peran-pengguna--hak-akses-rbac)
4. [Tech Stack Utama](#-tech-stack-utama)
5. [Standar Desain & Sistem Animasi (60fps.design)](#-standar-desain--sistem-animasi-60fpsdesign)
6. [Panduan Instalasi & Menjalankan di Lokal](#-panduan-instalasi--menjalankan-di-lokal)
7. [Panduan Deployment di Server Lokal Perusahaan (LAN / Intranet)](#-panduan-deployment-di-server-lokal-perusahaan-lan--intranet)

---

## 🌐 KATALOG & DESKRIPSI FUNGSI HALAMAN

Berikut adalah dokumentasi lengkap seluruh halaman aplikasi yang tersedia:

| Halaman | Rute (*Route*) | Hak Akses | Deskripsi & Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Landing Page Publik** | `/` atau `/landingpage` | Publik (Tanpa Login) | Papan informasi kehadiran publik yang menampilkan daftar karyawan yang sedang cuti **hari ini secara real-time**. Dilengkapi filter kategori (Pimpinan/Pelaksana), filter jenis cuti, pencarian instan, pop-up modal rincian cuti, statistik ringkas, dan bagian FAQ sistem. |
| **Halaman Login** | `/login` | Publik (Tamu) | Gerbang masuk aplikasi bagi staf administrasi dan pimpinan. Memvalidasi username & password dengan enkripsi bcrypt dan menerbitkan token sesi JWT (*HttpOnly Cookie*). Pada mode development, tersedia tombol isi cepat akun demo. |
| **Dashboard Utama** | `/dashboard` | Staf & Admin SDM | Pusat komando eksekutif yang menyajikan metrik statistik operasional (total karyawan aktif, karyawan cuti hari ini, sisa saldo kuota rata-rata), grafik rekapitulasi, dan tabel permohonan cuti terbaru. |
| **Master Karyawan** | `/master-karyawan` | Admin Utama SDM | Manajemen basis data karyawan PG Trangkil (NIP, nama, jabatan, kategori Pimpinan/Pelaksana, unit kerja, stasiun kerja, tanggal pengangkatan). Menghitung masa kerja dan hak cuti otomatis, dilengkapi modal tambah/edit/hapus data dan tab filter *sliding pill*. |
| **Master Bagian** | `/master-bagian` | Admin Utama SDM | Pengelolaan departemen atau unit kerja instansi (contoh: Tanaman, Fabrikasi, Teknik, TUK, Pimpinan). Mengelola kode bagian unik, nama bagian, dan status aktif. |
| **Master Stasiun** | `/master-stasiun` | Admin Utama SDM | Pengelolaan data stasiun atau pos kerja di bawah departemen tertentu (contoh: Gilingan, Besali, Ketel, Listrik). Terhubung langsung dengan relasi bagian. |
| **Pengambilan Cuti** | `/ambil-cuti` | Admin Bagian & SDM | Formulir operasional pengajuan permohonan cuti karyawan. Mendukung pemilihan tanggal jamak (*multi-date picker*), kalkulasi otomatis hari kerja (mengabaikan hari libur), validasi sisa saldo cuti secara presisi, dan pencatatan alasan cuti. |
| **Tambah Saldo Cuti** | `/tambah-saldo-cuti` | Admin Utama SDM | Formulir penambahan kuota saldo cuti karyawan (Tahunan, Besar, Inhaldagen) baik secara manual perorangan maupun penyesuaian khusus dengan catatan mutasi saldo. |
| **Rincian Cuti** | `/rincian-cuti` | Admin Bagian & SDM | Buku besar (*ledger*) riwayat cuti karyawan. Menampilkan jejak transaksi penambahan saldo, pemotongan cuti, tanggal-tanggal pelaksanaan cuti, sisa saldo terkini, dan log audit mutasi saldo. |
| **Laporan Cuti** | `/laporan-cuti` | Admin Bagian & SDM | Modul pelaporan komprehensif riwayat cuti karyawan dengan filter tanggal periode, filter departemen, filter jenis cuti, serta fitur cetak laporan (*print layout*) berstandar kertas resmi perusahaan. |
| **Kelola Pengguna** | `/kelola-user` | Admin Utama SDM | Pengelolaan akun pengguna sistem SIP-CUTI. Mengatur penambahan user, penetapan role (Admin Utama SDM vs Admin Bagian), penugasan departemen kerja, reset kata sandi, dan aktivasi/penonaktifan akun. |
| **Automasi Saldo** | `/pengaturan/automasi-saldo` | Admin Utama SDM | Konfigurasi aturan bisnis cuti otomatis: jadwal penambahan cuti tahunan (12 hari), regulasi cuti besar (siklus kelipatan 6 tahun masa kerja), batas maksimal carry over (akumulasi sisa saldo tahun lalu), dan batas waktu kedaluwarsa kuota. |
| **Profil Perusahaan** | `/pengaturan/profil-perusahaan` | Admin Utama SDM | Konfigurasi identitas perusahaan yang tampil di kop dokumen cetak dan antarmuka: nama instansi, unit usaha, alamat pabrik gula, nomor telepon, email resmi, dan logo instansi. |
| **Keamanan Akun** | `/pengaturan/keamanan-akun` | Seluruh Pengguna | Pengaturan profil akun pribadi pengguna yang sedang login: ubah foto profil (dilengkapi pemotong foto / *image crop* modal), ubah nama lengkap, ubah username login, dan ganti kata sandi akun. |

---

## 📂 ARSITEKTUR & STRUKTUR DIREKTORI PROYEK

Aplikasi ini menggunakan pola arsitektur **Feature-Sliced & Component-Driven** yang rapi agar mudah dipelajari dan dikembangkan oleh developer selanjutnya:

```
cuti-pgtk/
├── .env.example                     # Template resmi variabel lingkungan (Environment variables)
├── next.config.mjs                  # Konfigurasi Next.js (URL redirects legacy, bundle analyzer)
├── package.json                     # Daftar paket dependensi dan npm scripts
├── postcss.config.mjs               # Konfigurasi PostCSS untuk Tailwind CSS
├── tailwind.config.ts               # Konfigurasi token warna brand, border-radius, dan font
├── tsconfig.json                    # Konfigurasi kompilasi TypeScript
├── style guide.md                   # Pedoman resmi warna brand, tipografi, dan estetika UI
├── README.md                        # Dokumentasi komprehensif sistem (Dokumen ini)
│
├── prisma/                          # Layer Basis Data (ORM Prisma & MySQL)
│   ├── schema.prisma                # Definisi skema tabel, relasi antar-entitas, dan enum
│   ├── seed.ts                      # Script seeding awal (Akun default Admin & Master Data)
│   └── seed-settings.ts             # Script seeding konfigurasi automasi saldo & profil pabrik
│
├── public/                          # Berkas Statis Publik
│   ├── assets/                      # Logo resmi PG Trangkil & PT Kebon Agung
│   └── uploads/
│       └── profile/                 # Direktori penyimpanan berkas foto profil pengguna (Local Disk)
│
└── src/                             # Source Code Utama Aplikasi
    ├── actions/                     # Server Actions Next.js (Mutasi Data Backend & Validasi)
    │   ├── aksi-autentikasi.ts      # Logika login, verifikasi password bcrypt, dan logout
    │   ├── aksi-cuti.ts             # Pengajuan cuti, potong saldo ledger, dan tambah saldo
    │   ├── aksi-karyawan.ts         # Tambah, perbarui, dan hapus master data karyawan
    │   ├── aksi-bagian.ts           # CRUD departemen / bagian kerja
    │   ├── aksi-stasiun.ts          # CRUD stasiun kerja
    │   ├── aksi-pengguna.ts         # CRUD user aplikasi & penugasan role
    │   └── aksi-pengaturan.ts       # Update profil perusahaan, kebijakan cuti, dan keamanan akun
    │
    ├── app/                         # Routing Next.js App Router (Layouts & Pages)
    │   ├── globals.css              # CSS global, root variables, utilities, dan @keyframes shimmer
    │   ├── layout.tsx               # Root layout aplikasi (Fonts, Sonner Toaster, Title sync)
    │   ├── loading.tsx              # Loading fallback global (Minimalist "Memuat data...")
    │   │
    │   ├── (auth)/                  # Route Group: Area Autentikasi
    │   │   └── login/page.tsx       # Tampilan antarmuka halaman login
    │   │
    │   ├── (dashboard)/             # Route Group: Area Sistem Internal (Terlindungi Sesi)
    │   │   ├── layout.tsx           # App Shell (Sidebar mandiri, Header dinamis, PageTransition)
    │   │   ├── dashboard/page.tsx   # Halaman dashboard ringkasan statistik
    │   │   ├── master-karyawan/     # Halaman & layout modul master karyawan
    │   │   ├── master-bagian/       # Halaman & layout modul master bagian
    │   │   ├── master-stasiun/      # Halaman & layout modul master stasiun
    │   │   ├── ambil-cuti/          # Halaman formulir pengajuan cuti
    │   │   ├── tambah-saldo-cuti/   # Halaman formulir penambahan saldo cuti
    │   │   ├── rincian-cuti/        # Halaman buku besar ledger cuti per karyawan
    │   │   ├── laporan-cuti/        # Halaman pelaporan & cetak rekap cuti
    │   │   ├── kelola-user/         # Halaman manajemen pengguna aplikasi
    │   │   └── pengaturan/          # Sub-modul pengaturan sistem (Layout tab navigasi)
    │   │       ├── automasi-saldo/  # Halaman konfigurasi aturan otomatis saldo
    │   │       ├── profil-perusahaan/# Halaman profil instansi PG Trangkil
    │   │       └── keamanan-akun/   # Halaman pengaturan profil & password pengguna
    │   │
    │   └── landingpage/page.tsx     # Halaman landing page publik kehadiran cuti hari ini
    │
    ├── components/                  # Komponen Antarmuka Pengguna (UI)
    │   ├── bersama/                 # Komponen Reusable Lintas Modul
    │   │   ├── indikator-loading-halaman.tsx # Bar progres loading saat navigasi halaman
    │   │   ├── kartu-statistik.tsx           # Re-export kartu statistik metric
    │   │   ├── pemilih-tanggal.tsx           # Re-export kalender pemilih tanggal
    │   │   └── penyesuai-judul.tsx           # Sinkronisasi judul halaman tab browser dinamis
    │   │
    │   ├── fitur/                   # Komponen Khusus Berbasis Fitur Bisnis
    │   │   ├── cuti/                # Komponen aktivitas cuti, mutasi saldo, dan formulir
    │   │   ├── kelola-user/         # Tabel data user & modal tambah/edit user
    │   │   ├── master-bagian/       # Tabel bagian & modal tambah/edit bagian
    │   │   ├── master-karyawan/     # Tabel master karyawan & modal formulir karyawan
    │   │   ├── master-stasiun/      # Tabel stasiun & modal tambah/edit stasiun
    │   │   └── pengaturan/          # Modal crop foto, ubah nama, username, dan password
    │   │
    │   ├── landingpage/             # Komponen Khusus Landing Page Publik
    │   │   ├── hero-showcase.tsx    # Banner utama & ringkasan metrik cuti hari ini
    │   │   ├── tabel-cuti-landing.tsx # Tabel pencarian & filter cuti publik + detail dialog
    │   │   ├── faq-accordion.tsx    # Akordion FAQ dengan animasi tinggi halus
    │   │   ├── navbar-landing.tsx   # Navigasi atas dengan efek glassmorphism & tombol login
    │   │   └── footer-landing.tsx   # Footer legalitas PG Trangkil - PT Kebon Agung
    │   │
    │   ├── motion/                  # Komponen Animasi Berstandar 60fps
    │   │   ├── page-transition.tsx  # Wrapper transisi halaman konten dashboard (y: 6px -> 0)
    │   │   └── animated-number.tsx  # Animasi counter angka statistik yang ringan
    │   │
    │   ├── tata-letak/              # Kerangka Tata Letak Dashboard (Shell)
    │   │   ├── header.tsx           # Header atas (Tombol toggle sidebar, avatar & profile dropdown)
    │   │   ├── sidebar.tsx          # Sidebar navigasi (Desktop collapse & Mobile drawer)
    │   │   └── konteks-sidebar.tsx  # React Context pengelola state collapse / open sidebar
    │   │
    │   └── ui/                      # Design System Primitif & Atomic Components
    │       ├── badge.tsx            # Komponen badge status (Muted corporate variants)
    │       ├── button.tsx           # Tombol dengan micro-interaction (active:scale-[0.98])
    │       ├── card.tsx             # Kontainer kartu dengan border subtle #E8F5FC
    │       ├── dialog.tsx           # Modal Dialog dengan AnimatePresence (Masuk & Keluar mulus)
    │       ├── input.tsx            # Input field teks dengan transisi fokus lembut
    │       ├── label.tsx            # Label form berbasis Radix UI Label
    │       ├── multi-date-picker.tsx# Pemilih tanggal jamak dengan animasi geser bulan
    │       ├── skeleton.tsx         # Skeleton loading dengan efek Linear/Vercel shimmer
    │       ├── stat-card.tsx        # Kartu statistik metrik ringkas dengan elevasi hover
    │       └── table.tsx            # Primitif elemen tabel data (Table, Tr, Th, Td)
    │
    ├── lib/                         # Pustaka Utilitas Inti (Libraries & Helpers)
    │   ├── auth/
    │   │   ├── password.ts          # Utilitas hash & compare password dengan bcryptjs
    │   │   └── session.ts           # Enkripsi/dekripsi JWT token, cookie store, & requireAuth()
    │   ├── db/
    │   │   └── prisma.ts            # Singleton instance PrismaClient
    │   ├── motion.ts                # Konfigurasi terpusat durasi, easing, spring, dan variants animasi
    │   ├── utils.ts                 # Utilitas penggabungan class Tailwind (clsx + twMerge)
    │   └── validation/              # Skema validasi data formulir berbasis Zod
    │       └── leave-schema.ts      # Validasi skema pengajuan permohonan cuti
    │
    └── types/                       # Definisi Tipe TypeScript (Type Definitions)
        ├── auth.ts                  # Tipe SessionUser, UserRole, Payload JWT
        ├── autentikasi.ts           # Re-export tipe sesi untuk kompatibilitas
        └── cuti.ts                  # Tipe model data cuti, mutasi saldo, dan karyawan
```

---

## 👥 PERAN PENGGUNA & HAK AKSES (RBAC)

Aplikasi menerapkan kontrol akses berbasis peran (*Role-Based Access Control*):

1. **`ADMIN_UTAMA` (Admin SDM & Umum)**:
   - Memiliki akses penuh (*full access*) ke seluruh modul sistem.
   - Mengelola Master Karyawan, Master Bagian, Master Stasiun Kerja.
   - Mengelola akun pengguna (tambah admin bagian, ganti role, reset password).
   - Mengatur kebijakan automasi saldo, carry over kuota, dan profil instansi.
   - Melakukan input cuti, tambah saldo, audit rincian cuti, dan cetak laporan seluruh departemen.

2. **`ADMIN_BAGIAN` (Staf Administrasi Bagian)**:
   - Memiliki akses operasional pada departemen kerjanya masing-masing.
   - Membuka menu Pengambilan Cuti untuk mendaftarkan permohonan cuti karyawan di unit kerjanya.
   - Melihat sisa kuota dan rincian buku besar saldo cuti karyawan unit kerjanya.
   - Mengakses dan mencetak laporan rekapitulasi cuti karyawan bagiannya.
   - Tidak memiliki akses ke menu Kelola User, Master Data, dan Pengaturan Kebijakan.

---

## 🛠️ TECH STACK UTAMA

- **Core Framework:** [Next.js 15](https://nextjs.org/) (App Router, React Server Components, Server Actions)
- **UI Library:** [React 19](https://react.dev/)
- **Bahasa:** [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Animasi & Motion:** [Motion for React](https://motion.dev/) (sebelumnya Framer Motion v13)
- **Basis Data:** [MySQL](https://www.mysql.com/) (Kompatibel dengan XAMPP, MariaDB, atau MySQL Server 8.0+)
- **ORM:** [Prisma ORM 5](https://www.prisma.io/)
- **Autentikasi & Keamanan:** JWT via [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Manipulasi Tanggal:** [date-fns](https://date-fns.org/)
- **Notifikasi Toast:** [Sonner](https://sonner.emilkowal.ski/)
- **Ikonografi:** [Lucide React](https://lucide.dev/)
- **Pemotong Foto:** [react-easy-crop](https://github.com/ValentinH/react-easy-crop)

---

## 🎨 STANDAR DESAIN & SISTEM ANIMASI (60fps.design)

Aplikasi mematuhi standar desain korporat resmi dan mikro-interaksi modern yang halus:

### 1. Palet Warna Resmi
- **Biru Utama (`#0789D1`):** Warna primer untuk aksi tombol utama, active navigation, dan tab seleksi.
- **Biru Tua (`#005B96`):** Warna sekunder untuk hover state, aksen header, dan elemen kontras tinggi.
- **Biru Muda / Es (`#E8F5FC`):** Background badge, hover item, dan garis tepi (*subtle border*).
- **Abu-abu Sangat Terang (`#F3F6F8`):** Background kanvas utama aplikasi dan field input.
- **Putih Bersih (`#FFFFFF`):** Warna kontainer kartu, modal dialog, dan dropdown.
- **Teks Utama (`#263238`):** Tipografi utama bernuansa biru-gelap pekat (bukan hitam pekat).
- **Teks Muted (`#6B7280`):** Tipografi pendukung untuk label, subtitle, dan keterangan.

### 2. Motion Design Tokens (`src/lib/motion.ts`)
- **Fast (`140ms`):** Respon tekan tombol (`active:scale-[0.98]`), rotasi ikon, dan penghapusan chip tanggal.
- **Normal (`200ms`):** Page transition konten dashboard (`opacity: 0 -> 1`, `y: 6px -> 0`), menu dropdown, dan modal backdrop.
- **Slow (`280ms`):** Kontainer modal dialog enter/exit dan ekspansi akordion FAQ.
- **Spring Physics:** `stiffness: 420, damping: 32` untuk sliding indicator tab kategori karyawan.
- **Accessibility:** Mendukung penuh `prefers-reduced-motion: reduce` untuk menonaktifkan gerakan transform bagi pengguna dengan sensitivitas gerak.

---

## 🚀 PANDUAN INSTALASI & MENJALANKAN DI LOKAL

### 1. Prasyarat Sistem
- **Node.js:** Versi `18.18.0` atau yang lebih baru (disarankan Node.js LTS v20 atau v22).
- **MySQL Database:** XAMPP, WampServer, atau MySQL Community Server yang sedang berjalan aktif di port `3306`.

### 2. Clone Repository & Install Dependensi
Buka terminal dan jalankan:
```bash
git clone https://github.com/Voncruyff/cuti-pgtk.git
cd cuti-pgtk
npm install
```

### 3. Konfigurasi Berkas Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Pastikan isi berkas `.env` mengarah ke database lokal Anda:
```env
NEXT_PUBLIC_APP_NAME="CUTI PGTK"
NEXT_PUBLIC_APP_DESCRIPTION="Sistem Informasi Manajemen Cuti PGTK"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

DATABASE_URL="mysql://root:@localhost:3306/cuti_pgtk"

AUTH_SECRET="dev_secret_cuti_pgtk_key_32_characters_long_minimum"
COOKIE_SECURE="false"

NODE_ENV="development"
PORT=3000
HOSTNAME="0.0.0.0"
```

### 4. Sinkronisasi Database & Seeding Awal
Sinkronkan skema tabel Prisma ke MySQL lokal dan masukkan data awal (Admin default & pengaturan sistem):
```bash
# Push skema tabel ke database MySQL
npx prisma db push

# Generate client Prisma terbaru
npx prisma generate

# Eksekusi seeding data awal
npx prisma db seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di alamat: **`http://localhost:3000`**

---

## 🏢 PANDUAN DEPLOYMENT DI SERVER LOKAL PERUSAHAAN (LAN / INTRANET)

Jika aplikasi dipasang di PC Server kantor PG Trangkil agar dapat diakses oleh seluruh staf administrasi di jaringan Wi-Fi / LAN kantor:

### 1. Konfigurasi IP pada `.env`
Sesuaikan `NEXT_PUBLIC_APP_URL` dengan alamat IP lokal server kantor (contoh: `192.168.100.20`):
```env
NEXT_PUBLIC_APP_NAME="CUTI PGTK"
NEXT_PUBLIC_APP_DESCRIPTION="Sistem Informasi Manajemen Cuti PGTK"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://192.168.100.20:3000"

# Kredensial MySQL server perusahaan
DATABASE_URL="mysql://root:password_server@localhost:3306/cuti_pgtk"

# Ganti kunci JWT dengan string acak yang aman
AUTH_SECRET="kunci_rahasia_pg_trangkil_produksi_minimal_32_karakter"

# Wajib "false" jika server diakses via HTTP lokal (tanpa SSL) agar login tidak mental
COOKIE_SECURE="false"

NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

### 2. Buka Port di Windows Firewall Server
Izinkan port masuk (*Inbound Rule*) `3000` pada Windows Defender Firewall server kantor agar komputer lain di jaringan LAN dapat terhubung.

### 3. Build & Jalankan Server Produksi
Jalankan kompilasi bundle produksi Next.js:
```bash
# Build aplikasi produksi
npm run build

# Menjalankan server Next.js mengikat ke semua IP jaringan (0.0.0.0)
npm run start -- -H 0.0.0.0 -p 3000
```

### 4. Akses dari Komputer Karyawan
Karyawan atau staf administrasi di ruangan lain cukup membuka peramban web (*browser*) dan mengakses:
```
http://192.168.100.20:3000
```

---

## 📝 LISENSI & KEPEMILIKAN

Aplikasi ini dikembangkan untuk kebutuhan internal operasional:
**PT Kebon Agung — Pabrik Gula Trangkil**  
Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah, Indonesia.  
*Hak cipta dilindungi undang-undang.*
