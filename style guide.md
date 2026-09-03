# Panduan Desain & Standar Antarmuka (Style Guide)
## Sistem Informasi Pengelolaan Cuti (SIP-CUTI) • PT Kebon Agung - PG Trangkil

Dokumen ini merupakan panduan tunggal resmi identitas visual, palet warna, tipografi, prinsip **Minimalism Design**, dan penerapan **Subtle Glassmorphism** untuk seluruh modul aplikasi SIP-CUTI PT Kebon Agung Pabrik Gula Trangkil.

---

## 🎨 1. Palet Warna Resmi (Color Palette)

Semua elemen antarmuka **wajib** menggunakan palet warna korporat di bawah ini. Penggunaan warna neon, mencolok (*vivid/fluorescent*), atau warna yang tidak selaras **dilarang**.

| Sampel | Nama Warna | Hex Code | RGB | HSL | Peruntukan & Panduan Pemakaian |
| :---: | :--- | :---: | :---: | :---: | :--- |
| ![#0789D1](https://via.placeholder.com/20/0789D1/0789D1.png) | **Biru Utama (Primary)** | `#0789D1` | `rgb(7, 137, 209)` | `hsl(201, 93%, 42%)` | Warna merek primer: Tombol utama, lencana cuti tahunan, ikon sorotan, pendaran fokus aktif. |
| ![#005B96](https://via.placeholder.com/20/005B96/005B96.png) | **Biru Tua (Secondary)** | `#005B96` | `rgb(0, 91, 150)` | `hsl(204, 100%, 29%)` | Warna merek sekunder: Status hover tombol primer, teks judul aksen, badge pimpinan, status aktif. |
| ![#E8F5FC](https://via.placeholder.com/20/E8F5FC/E8F5FC.png) | **Biru Muda (Accent)** | `#E8F5FC` | `rgb(232, 245, 252)` | `hsl(201, 77%, 95%)` | Warna aksen lembut: Latar belakang lencana (*badge container*), kartu tanggal (*chips*), pembatas tipis. |
| ![#F3F6F8](https://via.placeholder.com/20/F3F6F8/F3F6F8.png) | **Background** | `#F3F6F8` | `rgb(243, 246, 248)` | `hsl(204, 24%, 96%)` | Warna dasar kanvas/halaman web, latar belakang kolom input pencarian, kepala tabel (*thead*). |
| ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF.png) | **Putih** | `#FFFFFF` | `rgb(255, 255, 255)` | `hsl(0, 0%, 100%)` | Kontainer kartu data (*card surface*), modal pop-up dialog, navbar, teks kontras di atas tombol primer. |
| ![#263238](https://via.placeholder.com/20/263238/263238.png) | **Teks Utama** | `#263238` | `rgb(38, 50, 56)` | `hsl(200, 19%, 18%)` | Teks judul utama (*headings*), nama karyawan, label penting, data bernilai tinggi. Kontras tinggi & nyaman dibaca. |
| ![#6B7280](https://via.placeholder.com/20/6B7280/6B7280.png) | **Teks Sekunder** | `#6B7280` | `rgb(107, 114, 128)` | `hsl(220, 9%, 46%)` | Teks keterangan, deskripsi pendukung, NIP karyawan, stasiun kerja, placeholder input, teks penjelas. |

---

## 🚫 2. Larangan Penggunaan Warna Neon (*Anti-Neon Policy*)

Aplikasi SIP-CUTI merupakan sistem operasional korporat formal PG Trangkil. Oleh karena itu:
- **HINDARI WARNA NEON / FLUORESCENT**:
  - Dilarang memakai warna hijau neon terang (`#00FF66`, `#39FF14`).
  - Dilarang memakai warna biru elektrik neon (`#00FFFF`, `#00F0FF`).
  - Dilarang memakai warna merah/pink neon (`#FF007F`, `#FF0055`).
  - Dilarang memakai warna kuning neon (`#FFFF00`).
- **PENGGUNAAN WARNA STATUS**:
  - Jika memerlukan indikator netral atau pelaksana: Gunakan slate kalem (`slate-100` / `slate-700`).
  - Jika memerlukan status info: Gunakan `#E8F5FC` dengan teks `#005B96`.
  - Jika memerlukan status sukses: Gunakan hijau hutan/sage teduh (`#15803d` / `#f0fdf4`), bukan hijau stabilo.

---

## 🧘‍♂️ 3. Prinsip Desain Minimalis (*Minimalism Design*)

Filosofi antarmuka SIP-CUTI berakar pada **kesederhanaan, kerapian data, dan efisiensi navigasi**:

1. **Bebas Distraksi (*Clutter-Free Focus*)**:
   - Hapus elemen dekoratif yang berlebihan atau tidak fungsional (misalnya: avatar inisial bulat yang tidak perlu, teks subtitle yang repetitif, atau garis batas ganda).
   - Biarkan data penting berbicara tanpa persaingan visual.

2. **Ruang Bernapas & Ruang Negatif (*Negative Space*)**:
   - Gunakan bantalan (*padding*) dan margin yang proporsional (`p-4 sm:p-6`, `gap-3 sm:gap-4`) untuk memisahkan antar kelompok data.
   - Ruang kosong bukan ruang hilang, melainkan jeda mata yang membuat pengguna tidak lelah saat memantau data.

3. **Konten Utama Sebagai Prioritas (*Content-First Hierarchy*)**:
   - Nama karyawan, jenis cuti, dan durasi harus langsung tertangkap mata dalam waktu < 1 detik.
   - Gunakan hirarki ketebalan font (`font-bold` pada nama vs `font-mono text-slate-500` pada NIP) untuk memandu pandangan mata secara natural.

4. **Keringkasan Baris Tabel (*Tabular Elegance*)**:
   - Hindari menjejalkan seluruh data panjang ke dalam satu sel baris tabel (misalnya tanggal cuti yang panjang).
   - Tampilkan informasi ringkas pada tabel (misal: `⏱️ 2 Hari`), dan sediakan tombol interaktif **"Detail"** untuk membuka rincian lengkap dalam pop-up modal.

5. **Interaksi Halus Tanpa Kedipan (*Smooth, Non-Blinking Interactions*)**:
   - Dilarang memakai animasi berkedut (*blinking pulse* terus-menerus) pada titik status yang membuat mata terganggu.
   - Gunakan transisi mikro yang tenang dan mulus: `transition-all duration-150` atau `duration-200`.

---

## 💎 4. Sentuhan Glassmorphism Halus (*Subtle Glassmorphism*)

Sentuhan *glassmorphism* pada SIP-CUTI diterapkan secara **lembut, proporsional, dan tidak berlebihan** (*tasteful & functional accent*):

1. **Tingkat Transparansi Terukur (*Optimal Translucency*)**:
   - **Wadah Kartu & Tabel**: `bg-white/85` hingga `bg-white/90` dengan `backdrop-blur-xl`. Memastikan teks tetap tajam 100% tanpa penurunan keterbacaan (*contrast compliance*).
   - **Bilah Header / Navbar**: `bg-white/80` (saat statis) hingga `bg-white/95` (saat *scrolled*) dengan `backdrop-blur-2xl`.

2. **Garis Batas Halus (*Sub-Pixel Refraction Borders*)**:
   - Gunakan garis pembatas tipis beraksen lembut: `border border-[#E8F5FC]` atau `border border-white/80`.
   - Menghasilkan siluet permukaan kaca yang jernih tanpa garis batas tebal yang kaku.

3. **Pendaran Latar Belakang Ambient (*Calm Ambient Glow*)**:
   - Latar belakang kanvas didukung pendaran cahaya radial lembut ber-opacity sangat rendah di belakang permukaan kaca:
     - Bulatan 1: `bg-[#0789D1]/10 blur-3xl`
     - Bulatan 2: `bg-[#005B96]/8 blur-3xl`
     - Bulatan 3: `bg-[#E8F5FC]/70 blur-3xl`
   - Pendaran ini memberikan kedalaman (*depth*) dimensional tanpa menimbulkan kilauan neon.

4. **Elevasi Mengambang Tenang (*Subtle Floating Elevation*)**:
   - Gunakan bayangan halus terdispersi: `shadow-[0_4px_20px_rgb(0,0,0,0.03)]` untuk panel metrik dan tabel.
   - Untuk modal pop-up: `shadow-[0_20px_60px_rgb(0,0,0,0.1)]`.

---

## 🔤 5. Tipografi (Typography)

Sistem menggunakan font berbasis **Plus Jakarta Sans** (dengan fallback ke **Inter** dan `system-ui`).

### Skala Tipografi:
1. **Heading 1 (Judul Halaman)**:
   - Ukuran: `text-2xl sm:text-3xl` (24px - 30px)
   - Ketebalan: `font-black` (900)
   - Warna: `#263238` (Teks Utama)
   - Tracking: `tracking-tight`

2. **Heading 2 / Modal Title (Sub-judul / Judul Dialog)**:
   - Ukuran: `text-base sm:text-lg` (16px - 18px)
   - Ketebalan: `font-bold` (700)
   - Warna: `#263238`

3. **Body Text / Nama Karyawan**:
   - Ukuran: `text-xs sm:text-sm` (12px - 14px)
   - Ketebalan: `font-semibold` (600) untuk nama, `font-normal` (400) untuk paragraf umum.
   - Warna: `#263238`

4. **Secondary / Caption / NIP**:
   - Ukuran: `text-[10px]` sampai `text-[11px]` (10px - 11px)
   - Font NIP: `font-mono`
   - Warna: `#6B7280` (Teks Sekunder)

---

## 🧩 6. Spesifikasi Komponen

### A. Tombol (Buttons)
- **Tombol Utama (Primary)**:
  - Kelas: `bg-[#0789D1] hover:bg-[#005B96] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors`
- **Tombol Aksi Detail (Action)**:
  - Kelas: `bg-white hover:bg-[#E8F5FC] text-[#005B96] hover:text-[#0789D1] border border-[#E8F5FC] text-xs font-semibold rounded-lg shadow-2xs transition-all`
- **Tombol Tutup / Sekunder**:
  - Kelas: `bg-[#F3F6F8] hover:bg-slate-200 text-[#263238] border border-[#E8F5FC] text-xs font-semibold rounded-lg`

### B. Lencana Jenis Cuti (Leave Badges)
- **Cuti Tahunan**:
  - Latar: `#E8F5FC`
  - Teks: `#0789D1`
  - Border: `#0789D1/30`
- **Cuti Besar**:
  - Latar: `#F3F6F8`
  - Teks: `#005B96`
  - Border: `#005B96/30`
- **Inhaldagen**:
  - Latar: `#E8F5FC`
  - Teks: `#005B96`
  - Border: `#005B96/30`
- **Kategori Pimpinan**:
  - Latar: `#E8F5FC`
  - Teks: `#005B96`
  - Border: `#0789D1/30`
- **Kategori Pelaksana**:
  - Latar: `#F3F6F8` (abu-abu tenang)
  - Teks: `slate-700`
  - Border: `slate-200`

### C. Tabel Data Karyawan
- **Header Tabel (`thead`)**: `bg-[#F3F6F8]/80 text-[#6B7280] font-semibold border-b border-[#E8F5FC] text-[11px]`
- **Baris Tabel (`tbody tr`)**: `hover:bg-[#E8F5FC]/30 transition-colors duration-150`
- **Pemisah Baris**: `divide-y divide-[#E8F5FC]/60`

### D. Modal Pop-up Dialog
- **Wadah Luar**: `bg-white border border-[#E8F5FC] shadow-[0_20px_60px_rgb(0,0,0,0.1)] rounded-2xl`
- **Kartu Informasi Internal**: `bg-[#F3F6F8] border border-[#E8F5FC] rounded-xl`
- **Chips Tanggal**: `bg-white border border-[#E8F5FC] text-[#263238] font-semibold text-xs rounded-lg`

---

## 🛠️ 7. Referensi Konfigurasi Tailwind (`tailwind.config.ts`)

```typescript
colors: {
  brand: {
    primary: "#0789D1",       // Biru Utama
    secondary: "#005B96",     // Biru Tua
    accent: "#E8F5FC",        // Biru Muda
    bg: "#F3F6F8",            // Background
    white: "#FFFFFF",         // Putih
    textPrimary: "#263238",   // Teks Utama
    textSecondary: "#6B7280", // Teks Sekunder
  }
}
```
