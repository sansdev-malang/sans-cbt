# CBT Sekolah Anak Saleh — Feature & Development Specification

## 1. Gambaran Umum

Dokumen ini merupakan spesifikasi awal sistem **Computer Based Test (CBT) Sekolah Anak Saleh** berdasarkan flow fitur pada rancangan.

Sistem ditujukan untuk:

- Siswa sebagai peserta ujian.
- Guru sebagai pembuat dan pengelola soal/ujian.
- Admin sebagai pengelola sistem.
- Orang tua sebagai pihak yang dapat memantau hasil/nilai anak jika fitur tersebut diaktifkan.

### Stack Utama

- **Backend:** Laravel
- **Frontend:** React + TypeScript
- **SPA bridge:** Inertia.js
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** MySQL
- **Authentication:** Laravel Authentication
- **CBT Client:** Web terlebih dahulu, dengan opsi Electron untuk Windows dan Android App/Kiosk untuk perangkat mobile.
- **Security:** server-side validation, session/device binding, audit log, timer berbasis server.

---

# 2. Modul Utama

Dari flow rancangan, sistem terdiri dari 8 modul utama:

1. Daftar Ujian
2. Kerjakan Ujian
3. Anti-Kecurangan
4. Nilai Otomatis
5. Buat Soal
6. Kelola Ujian
7. Pantau Nilai Anak
8. Masuk & Akun

---

# 3. Daftar Ujian

## Tujuan

Menampilkan seluruh ujian yang tersedia untuk siswa berdasarkan jadwal, kelas, mata pelajaran, dan status ujian.

## Subfitur

### 3.1 Lihat Hari Ini

Menampilkan ujian yang dijadwalkan pada hari berjalan.

Informasi minimal:

- Nama ujian
- Mata pelajaran
- Kelas
- Guru
- Tanggal
- Jam mulai
- Jam selesai
- Durasi
- Status ujian

### 3.2 Status Ujian

Status yang dapat digunakan:

- Akan Datang
- Belum Dimulai
- Sedang Berlangsung
- Selesai
- Terlambat
- Tidak Diikuti

### 3.3 Sisa Waktu

Menampilkan countdown menuju:

- Waktu mulai ujian
- Waktu berakhir ujian

Timer harus menggunakan waktu server sebagai sumber kebenaran.

---

# 4. Kerjakan Ujian

## Tujuan

Modul utama yang digunakan siswa saat mengerjakan CBT.

## Subfitur

### 4.1 Pilih Jawaban

Untuk soal pilihan ganda:

- Pilihan A
- Pilihan B
- Pilihan C
- Pilihan D
- Pilihan E jika diperlukan

Jawaban disimpan secara otomatis.

### 4.2 Pindah Soal

Siswa dapat:

- Soal berikutnya
- Soal sebelumnya
- Memilih nomor soal secara langsung
- Menandai soal untuk ditinjau kembali

### 4.3 Timer Ujian

Timer:

- Dimulai berdasarkan waktu server.
- Tidak boleh hanya bergantung pada JavaScript client.
- Tetap divalidasi ketika siswa melakukan request ke server.
- Ketika waktu habis, sistem otomatis mengunci sesi dan melakukan submit.

---

# 5. Anti-Kecurangan

## Tujuan

Mengurangi kemungkinan kecurangan dan mencatat aktivitas mencurigakan selama ujian.

> Catatan: sistem tidak dapat menjamin pencegahan kecurangan 100%, terutama jika siswa menggunakan perangkat kedua. Sistem harus berfokus pada pencegahan, deteksi, pencatatan, dan pengendalian sesi.

## Subfitur

### 5.1 Kunci Layar Ujian

Untuk client yang mendukung kiosk mode:

- Fullscreen
- Kiosk mode
- Membatasi navigasi keluar aplikasi
- Membatasi akses ke halaman lain

Untuk Windows dapat menggunakan Electron.

Untuk Android dapat menggunakan Android kiosk/lock task pada perangkat yang dikelola sekolah.

### 5.2 Deteksi Pindah Aplikasi

Catat ketika:

- Browser kehilangan fokus
- Window CBT tidak aktif
- Siswa keluar dari aplikasi CBT
- Siswa kembali ke CBT

Setiap kejadian disimpan ke audit log.

Contoh:

```text
VIOLATION
student_id: 10023
exam_id: 2026-001
type: WINDOW_BLUR
timestamp: 2026-09-30 09:12:31
```

### 5.3 Acak Soal & Jawaban

Randomisasi:

- Urutan soal
- Urutan pilihan jawaban

Seed randomisasi sebaiknya disimpan pada sesi ujian sehingga susunan soal konsisten selama sesi siswa.

### 5.4 Deteksi Pindah Aplikasi

Client mencatat aktivitas keluar dari konteks ujian.

Level pelanggaran dapat dibuat:

```text
INFO
WARNING
VIOLATION
CRITICAL
```

Sistem tidak langsung menganggap setiap kehilangan fokus sebagai bukti kecurangan; guru/admin dapat melihat riwayat aktivitas.

---

# 6. Nilai Otomatis

## Tujuan

Menghitung nilai secara otomatis setelah siswa menyelesaikan ujian.

## Subfitur

### 6.1 Hasil Langsung

Opsional berdasarkan pengaturan ujian.

Contoh:

- Nilai langsung ditampilkan setelah submit.
- Nilai disembunyikan sampai guru membuka hasil.

### 6.2 Rincian Jawaban

Menampilkan:

- Nomor soal
- Jawaban siswa
- Kunci jawaban jika diizinkan
- Benar/salah
- Bobot
- Skor

### 6.3 Riwayat Nilai

Menyimpan histori:

- Ujian
- Mata pelajaran
- Nilai
- Waktu pengerjaan
- Status

---

# 7. Buat Soal

## Tujuan

Guru/admin membuat dan mengelola bank soal.

## Subfitur

### 7.1 Tulis Soal Pilihan Ganda

Field minimal:

```text
Pertanyaan
Pilihan A
Pilihan B
Pilihan C
Pilihan D
Pilihan E (opsional)
Kunci Jawaban
Bobot
Mata Pelajaran
Kelas
Materi
Tingkat Kesulitan
```

### 7.2 Soal Lain

Arsitektur sebaiknya disiapkan agar dapat dikembangkan untuk:

- Pilihan ganda
- Benar/salah
- Esai
- Pilihan ganda kompleks
- Soal dengan gambar
- Soal dengan audio/video

### 7.3 Sisipkan Gambar

Guru dapat memasukkan gambar pada:

- Pertanyaan
- Pilihan jawaban

Media sebaiknya disimpan menggunakan storage terkontrol dan tidak menggunakan URL publik yang tidak diperlukan.

---

# 8. Kelola Ujian

## Tujuan

Mengatur pelaksanaan ujian.

## Subfitur

### 8.1 Buat Jadwal Ujian

Data minimal:

```text
Nama Ujian
Mata Pelajaran
Kelas
Tanggal
Jam Mulai
Jam Selesai
Durasi
```

### 8.2 Pilih Soal & Pelajaran

Guru dapat:

- Memilih bank soal
- Memilih sejumlah soal
- Menggunakan semua soal
- Mengacak soal
- Mengacak jawaban

### 8.3 Atur Peserta

Peserta dapat ditentukan berdasarkan:

- Kelas
- Rombel
- Daftar siswa
- Kelompok tertentu

---

# 9. Pantau Nilai Anak

## Tujuan

Memberikan akses pemantauan perkembangan nilai siswa.

## Subfitur

### 9.1 Nilai Terbaru

Menampilkan hasil ujian terbaru.

### 9.2 Grafik Perkembangan

Visualisasi:

- Nilai berdasarkan waktu
- Nilai per mata pelajaran
- Perbandingan hasil ujian
- Rata-rata nilai

### 9.3 Notifikasi Nilai Keluar

Opsional:

- Notifikasi dalam aplikasi
- Email
- WhatsApp melalui integrasi eksternal jika diperlukan

---

# 10. Masuk & Akun

## Tujuan

Mengatur autentikasi dan akun pengguna.

## Jenis Pengguna

### Admin

Hak akses:

- Pengaturan sistem
- Pengguna
- Guru
- Siswa
- Bank soal
- Ujian
- Hasil
- Audit log

### Guru

Hak akses:

- Bank soal
- Membuat ujian
- Menjadwalkan ujian
- Memantau peserta
- Melihat hasil ujian

### Siswa

Hak akses:

- Melihat ujian
- Mengerjakan ujian
- Melihat hasil sesuai kebijakan ujian
- Melihat riwayat nilai

### Orang Tua

Opsional:

- Melihat nilai anak
- Melihat grafik perkembangan
- Menerima notifikasi hasil

---

# 11. Struktur Database Awal

Struktur database dapat dimulai dengan tabel berikut:

```text
users
roles
students
teachers
parents

subjects
classes
class_students

question_banks
questions
question_options
question_media

exams
exam_questions
exam_participants
exam_sessions

answers
results
result_details

devices
device_sessions

exam_logs
security_violations

notifications
```

---

# 12. Relasi Utama

```text
User
 ├── Student
 ├── Teacher
 └── Parent

Subject
 └── QuestionBank
      └── Question
           └── QuestionOption

Exam
 ├── Subject
 ├── Questions
 ├── Participants
 └── Sessions
      └── Answers

ExamSession
 ├── Student
 ├── Device
 ├── Answers
 ├── ExamLogs
 └── SecurityViolations

ExamSession
 └── Result
      └── ResultDetails
```

---

# 13. Arsitektur CBT

```text
                    ┌──────────────────┐
                    │     Laravel      │
                    │     Backend      │
                    └────────┬─────────┘
                             │
                        HTTPS / API
                             │
                  ┌──────────▼──────────┐
                  │ React + TypeScript  │
                  │ Inertia.js          │
                  └──────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
        Web Browser                    CBT Client
                                           │
                                  ┌────────┴────────┐
                                  │                 │
                              Electron          Android
                              Windows            Kiosk
```

---

# 14. Security Architecture

## Prinsip Utama

**Frontend tidak boleh dipercaya sebagai sumber kebenaran.**

Server Laravel harus menjadi sumber kebenaran untuk:

- Waktu mulai
- Waktu selesai
- Status ujian
- Peserta
- Hak akses
- Jawaban
- Nilai
- Status submit

### Server-side Timer

Jangan menggunakan:

```javascript
let remainingTime = 3600;
```

sebagai sumber utama.

Gunakan:

```text
exam_started_at
exam_ended_at
server_time
```

Client hanya menampilkan countdown berdasarkan data server.

---

# 15. Session Ujian

Saat siswa menekan **Mulai Ujian**:

```text
Login
  ↓
Validasi akun
  ↓
Validasi peserta
  ↓
Validasi jadwal
  ↓
Validasi device/session
  ↓
Buat exam_session
  ↓
Generate randomization
  ↓
Mulai timer server
  ↓
Tampilkan soal
```

---

# 16. Autosave Jawaban

Setiap jawaban siswa disimpan:

```text
Student
    ↓
Exam Session
    ↓
Question
    ↓
Answer
```

Autosave dilakukan setelah siswa memilih jawaban.

Jika koneksi terputus:

- Jawaban terakhir dapat disimpan sementara pada client.
- Ketika koneksi kembali, client melakukan sinkronisasi.
- Server melakukan validasi ulang sebelum menerima jawaban.

---

# 17. Audit Log

Semua aktivitas penting dicatat.

Contoh event:

```text
LOGIN
LOGOUT
START_EXAM
ANSWER_SAVED
QUESTION_CHANGED
WINDOW_BLUR
WINDOW_FOCUS
FULLSCREEN_EXIT
DEVICE_CHANGED
SUBMIT_EXAM
TIME_EXPIRED
SESSION_EXPIRED
```

Data log minimal:

```text
id
user_id
exam_id
exam_session_id
event_type
metadata
ip_address
user_agent
created_at
```

---

# 18. Alur Siswa

```text
Login
  ↓
Dashboard
  ↓
Daftar Ujian
  ↓
Pilih Ujian
  ↓
Lihat Detail
  ↓
Mulai Ujian
  ↓
Verifikasi Session
  ↓
Kerjakan Soal
  ↓
Autosave
  ↓
Timer Berjalan
  ↓
Submit / Waktu Habis
  ↓
Koreksi Otomatis
  ↓
Hasil Ujian
```

---

# 19. Alur Guru

```text
Login
  ↓
Dashboard Guru
  ↓
Buat Soal
  ↓
Simpan ke Bank Soal
  ↓
Buat Ujian
  ↓
Pilih Mata Pelajaran
  ↓
Pilih Soal
  ↓
Pilih Peserta
  ↓
Atur Jadwal
  ↓
Publikasikan
  ↓
Pantau Peserta
  ↓
Lihat Hasil
```

---

# 20. Alur Admin

```text
Login
  ↓
Dashboard Admin
  ↓
Kelola Pengguna
  ↓
Kelola Kelas
  ↓
Kelola Mata Pelajaran
  ↓
Kelola Guru & Siswa
  ↓
Monitoring Ujian
  ↓
Audit Log
  ↓
Laporan
```

---

# 21. Prioritas Development

## Phase 1 — Foundation

- Laravel
- React
- TypeScript
- Inertia
- Tailwind
- shadcn/ui
- Authentication
- Role & Permission
- Database

## Phase 2 — Master Data

- Siswa
- Guru
- Kelas
- Mata Pelajaran

## Phase 3 — Bank Soal

- CRUD soal
- Pilihan jawaban
- Kunci jawaban
- Gambar
- Bobot
- Kategori
- Tingkat kesulitan

## Phase 4 — Ujian

- Membuat ujian
- Jadwal
- Peserta
- Pemilihan soal
- Randomisasi

## Phase 5 — CBT Engine

- Halaman pengerjaan
- Timer
- Navigasi soal
- Autosave
- Submit
- Auto scoring

## Phase 6 — Security

- Session locking
- Device binding
- Audit log
- Focus detection
- Fullscreen detection
- Kiosk client
- Security violation monitoring

## Phase 7 — Reporting

- Nilai
- Riwayat
- Grafik
- Export
- Monitoring guru
- Pantauan orang tua

## Phase 8 — Dedicated Client

- Windows Electron
- Android Kiosk
- Device management

---

# 22. Prinsip UI/UX

Antarmuka harus:

- Responsif untuk desktop, laptop, tablet, dan smartphone.
- Sederhana untuk siswa SD.
- Menggunakan tombol besar dan mudah disentuh.
- Memiliki kontras yang jelas.
- Tidak menggunakan animasi berlebihan saat ujian.
- Menampilkan progress pengerjaan dengan jelas.
- Memberikan konfirmasi sebelum submit.
- Memberikan peringatan yang jelas ketika koneksi bermasalah.
- Memprioritaskan keterbacaan soal.

### Tampilan Siswa

```text
┌────────────────────────────────────────────┐
│ CBT SEKOLAH ANAK SALEH       ⏱ 48:32       │
├────────────────────────────────────────────┤
│                                            │
│ Soal 12 dari 40                            │
│                                            │
│ 12. Pertanyaan ditampilkan di sini...      │
│                                            │
│ ○ A. Jawaban pertama                       │
│ ○ B. Jawaban kedua                         │
│ ● C. Jawaban ketiga                        │
│ ○ D. Jawaban keempat                       │
│                                            │
├────────────────────────────────────────────┤
│ 1  2  3  4  5  6  7  8  9  10             │
│ 11 12 13 14 15 ...                         │
├────────────────────────────────────────────┤
│ [Sebelumnya]                [Berikutnya]    │
└────────────────────────────────────────────┘
```

---

# 23. Target Akhir

Sistem CBT diharapkan memiliki:

- Satu backend Laravel.
- Frontend React modern.
- Sistem role Admin/Guru/Siswa/Orang Tua.
- Bank soal terstruktur.
- Sistem jadwal ujian.
- CBT engine.
- Timer server-side.
- Autosave.
- Randomisasi.
- Auto scoring.
- Audit log.
- Security monitoring.
- Dashboard hasil.
- Dukungan desktop dan mobile.
- Opsi Windows Kiosk dan Android Kiosk.

## Status

**Dokumen ini adalah blueprint awal pengembangan CBT.**

Tahap berikutnya yang disarankan adalah membuat:

1. ERD/database schema.
2. Role & permission.
3. Migration Laravel.
4. Model dan relationship.
5. Struktur route.
6. Struktur React/Inertia.
7. Dashboard masing-masing role.
8. CBT engine.
