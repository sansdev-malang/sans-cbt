# 🎓 CBT Sekolah Anak Saleh

Sistem **Computer Based Test (CBT)** modern, aman, dan responsif yang dirancang untuk pelaksanaan asesmen dan ujian di **Sekolah Anak Saleh**. Platform ini dibangun dengan arsitektur SPA modern berbasis **Laravel 12**, **Inertia.js v3**, dan **React 19**, dilengkapi mesin anti-kecurangan serta koreksi otomatis berbasis server.

---

## 📌 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Hak Akses & Peran Pengguna](#-hak-akses--peran-pengguna)
- [Tipe Soal yang Didukung](#-tipe-soal-yang-didukung)
- [Arsitektur Keamanan CBT](#-arsitektur-keamanan-cbt)
- [Tech Stack](#-tech-stack)
- [Struktur Direktori](#-struktur-direktori)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Langkah Instalasi & Setup](#-langkah-instalasi--setup)
- [Akun Demo & Pengujian](#-akun-demo--pengujian)
- [Script & Perintah Tambahan](#-script--perintah-tambahan)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

- **⏱️ Server-Side Timer & Engine**: Waktu ujian dan validasi countdown diatur penuh oleh server untuk mencegah manipulasi waktu di sisi klien/browser.
- **💾 Autosave Real-Time**: Jawaban siswa tersimpan otomatis secara berkala saat pengerjaan soal berlangsung.
- **🛡️ Deteksi & Pencegahan Kecurangan (Anti-Cheating)**:
  - Deteksi perpindahan aplikasi/tab (Window Blur & Focus events).
  - Peringatan dan pembatasan keluar dari mode layar penuh (*Fullscreen*).
  - *Session locking* jika terdeteksi aktivitas mencurigakan yang membutuhkan izin buka oleh pengawas/guru.
  - Audit logging komprehensif untuk setiap aksi selama sesi ujian.
- **🎲 Randomisasi Soal & Opsi**: Pengacakan urutan soal dan opsi jawaban per siswa dengan *seed* konsisten selama sesi berjalan.
- **📊 Live Exam Monitoring**: Guru dan Admin dapat memantau status pengerjaan, waktu tersisa, progres soal, dan pelanggaran siswa secara *real-time*.
- **📝 Koreksi Otomatis & Penilaian Esai**: Nilai soal objektif dihitung otomatis seketika setelah submit, dengan antarmuka khusus bagi guru untuk menilai jawaban esai.

---

## 👥 Hak Akses & Peran Pengguna

| Peran | Deskripsi & Kemampuan Akses |
| :--- | :--- |
| **Admin** | Manajemen master data (Mata Pelajaran, Kelas, Siswa, Guru, Pengguna), monitoring sesi ujian seluruh sekolah, audit log keamanan, serta laporan rekapitulasi nilai. |
| **Guru** | Pembuatan dan pengelolaan Bank Soal, pengaturan jadwal ujian, pemilihan paket soal, monitoring ujian langsung, *unlock* sesi siswa, penilaian esai manual, dan ekspor hasil ujian. |
| **Siswa** | Melihat jadwal ujian aktif, mengerjakan soal ujian dengan CBT Engine, autosave, navigasi soal fleksibel, dan melihat riwayat hasil ujian. |

---

## 📑 Tipe Soal yang Didukung

Platform ini mendukung beragam tipe soal interaktif:

1. **Pilihan Ganda (*Multiple Choice*)**: Pilihan opsi A-E standar dengan dukungan gambar di pertanyaan maupun opsi jawaban.
2. **Pilihan Ganda Kompleks (*Multiple Answers*)**: Siswa dapat memilih lebih dari satu jawaban yang benar.
3. **Benar / Salah (*True / False*)**: Pernyataan bernilai tunggal benar atau salah.
4. **Pernyataan Benar-Salah (*Statement True/False*)**: Tabel daftar pernyataan dengan penilaian benar/salah pada masing-masing baris.
5. **Menjodohkan (*Matching Pairs*)**: Memasangkan item di kolom kiri dengan kolom kanan (teks maupun gambar).
6. **Esai (*Essay*)**: Jawaban uraian terbuka dengan sistem grading manual oleh guru.

---

## 🔒 Arsitektur Keamanan CBT

Sistem menerapkan prinsip **"Frontend tidak boleh dipercaya sebagai sumber kebenaran"**:

```
                       ┌────────────────────────┐
                       │     Laravel Backend    │
                       │ (Single Source of Truth)│
                       └───────────┬────────────┘
                                   │ HTTPS / Inertia
                       ┌───────────▼────────────┐
                       │   React + TypeScript   │
                       │     Tailwind CSS       │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
        Web Browser                               Client Kiosk
  (Fullscreen & Blur Guard)                 (Electron / Android Kiosk)
```

- **Waktu Server**: Klien hanya menampilkan hitung mundur dari selisih `server_time` dan batas waktu ujian.
- **Session Protection**: Setiap pengiriman jawaban (`POST /student/sessions/{session}/answers`) divalidasi apakah sesi masih aktif, belum submit, dan durasi belum habis.
- **Audit Logging**: Setiap aksi penting (`WINDOW_BLUR`, `WINDOW_FOCUS`, `FULLSCREEN_EXIT`, `START_EXAM`, `ANSWER_SAVED`, `SUBMIT_EXAM`) dicatat lengkap dengan timestamp, alamat IP, dan User Agent.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Laravel 12](https://laravel.com/) (Framework v13.x / PHP 8.3+)
- **SPA Bridge**: [Inertia.js v3](https://inertiajs.com/) (Laravel adapter)
- **Autentikasi**: Laravel Fortify & Passkeys (`@laravel/passkeys`)
- **Database**: SQLite (default lokal) / MySQL / MariaDB / PostgreSQL
- **Testing & Quality**: Pest PHP 5, Larastan (PHPStan), Laravel Pint

### Frontend
- **Library**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) & Vite-plus (`vp`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Komponen UI**: Radix UI Primitives, Tailwind Merge, Lucide Icons, Sonner (Toast)

---

## 📂 Struktur Direktori

```text
sans-cbt/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/         # Controller modul Administrator
│   │   │   ├── Teacher/       # Controller modul Guru (Soal, Ujian, Grading)
│   │   │   └── Student/       # Controller CBT Engine & Siswa
│   │   └── Middleware/        # Middleware autentikasi & role check
│   ├── Models/                # Model Eloquent (Exam, Question, Session, dll.)
│   └── Role.php               # Enum peran pengguna (Admin, Guru, Siswa)
├── database/
│   ├── migrations/            # Skema migrasi database
│   └── seeders/               # Data master & demo data
├── resources/
│   └── js/
│       ├── components/        # Komponen UI (Button, Dialog, Badge, dll.)
│       ├── layouts/           # AppLayout, AuthLayout, ExamLayout
│       └── pages/             # Halaman Inertia (Admin, Teacher, Student)
├── routes/
│   ├── web.php                # Rute aplikasi utama & role-based routing
│   └── settings.php           # Pengaturan profil dan akun
└── CBT_Sekolah_Anak_Saleh_Specification.md  # Dokumen spesifikasi teknis lengkap
```

---

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan sistem Anda telah terpasang:

- **PHP** >= 8.3 (dengan ekstensi `pdo`, `sqlite3`/`pdo_mysql`, `mbstring`, `gd`, `curl`, `openssl`, `tokenizer`)
- **Composer** >= 2.x
- **Node.js** >= 20.x dan **npm** atau **pnpm**
- **Git**

---

## 🚀 Langkah Instalasi & Setup

### 1. Clone Repositori
```bash
git clone <url-repository-anda>
cd sans-cbt
```

### 2. Salin Konfigurasi Lingkungan
```bash
cp .env.example .env
```
> Pada Windows PowerShell:
> ```powershell
> Copy-Item .env.example .env
> ```

### 3. Install Dependensi PHP & JavaScript
```bash
composer install
npm install
```

### 4. Generate Application Key
```bash
php artisan key:generate
```

### 5. Persiapan Database & Migrasi
Secara bawaan, aplikasi telah terkonfigurasi menggunakan **SQLite**. Buat file database jika belum tersedia:

```powershell
# Windows PowerShell
if (!(Test-Path "database/database.sqlite")) { New-Item -ItemType File -Path "database/database.sqlite" }
```
```bash
# Linux / macOS
touch database/database.sqlite
```

Jalankan migrasi database beserta data awal (seeders):
```bash
php artisan migrate --seed
```

*(Opsional)* Untuk menyertakan contoh lengkap seluruh tipe soal, gambar, dan simulasi ujian dari Guru:
```bash
php artisan db:seed --class=DemoGuruSeeder
```

### 6. Jalankan Server Pengembangan
Jalankan backend Laravel dan frontend Vite secara bersamaan menggunakan script bawaan:
```bash
composer run dev
```

Atau jalankan pada dua terminal terpisah:
```bash
# Terminal 1: Laravel Server
php artisan serve

# Terminal 2: Vite Dev Server
npm run dev
```

Buka browser Anda di: `http://localhost:8000` (atau URL Herd Anda `http://sans-cbt.test`).

---

## 🔑 Akun Demo & Pengujian

Semua akun demo di bawah ini menggunakan kata sandi bawaan: **`password`**

| Role | Email Login | Password | Akses & Fungsi Utama |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sekolahanaksaleh.sch.id` | `password` | Manajemen master data, audit logs, monitoring global |
| **Guru** | `guru@sekolahanaksaleh.sch.id` | `password` | Kelola Bank Soal, buat jadwal ujian, grading hasil |
| **Siswa 1** | `siswa@sekolahanaksaleh.sch.id` | `password` | Pengerjaan ujian CBT, navigasi soal, lihat hasil |
| **Siswa 2** | `siswa2@sekolahanaksaleh.sch.id` | `password` | Peserta ujian kedua (dari seeder demo) |

---

## ⚡ Script & Perintah Tambahan

Proyek ini dilengkapi dengan skrip automasi pengujian dan pemeliharaan kode:

```bash
# Menjalankan Linter PHP (Laravel Pint)
composer run lint

# Menjalankan Static Analysis PHP (PHPStan / Larastan)
composer run types:check

# Menjalankan Unit & Feature Testing (Pest PHP)
composer run test

# Type-check TypeScript Frontend
npm run types:check

# Build aset produksi (Frontend)
npm run build
```

---

## 📄 Spesifikasi Lengkap

Dokumentasi rancangan detail modul, skema basis data, spesifikasi REST/Inertia flow, dan panduan arsitektur keamanan dapat dipelajari pada:
👉 [CBT_Sekolah_Anak_Saleh_Specification.md](CBT_Sekolah_Anak_Saleh_Specification.md)

---

## 📜 Lisensi

Aplikasi ini dilisensikan di bawah lisensi [MIT](LICENSE). Dikembangkan untuk kebutuhan **Sekolah Anak Saleh**.

