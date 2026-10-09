# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-09
- **Kondisi working tree:** bersih (semua perubahan sudah di-commit & push)

## Tugas terakhir (SELESAI)

**Judul:** Perbaikan teks halaman Unit & pengguna

Rincian:
- Hapus catatan `Buat akun terlebih dahulu di Supabase Authentication...` (div `users-security-note`) beserta impor `CircleAlert` di `UsersPage.tsx`.
- Label `UID pengguna Auth` → `UID Pengguna`.
- Placeholder `UUID dari Supabase Auth` → `Masukan UID`.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `5a2c04d` Simplify Unit and user management copy (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

**Judul:** Top progress/loading bar hijau saat login & buka menu

Rincian:
- Komponen `src/components/feedback/ProgressBar.tsx` (+ `ProgressBar.css`) dan hook `src/components/feedback/progressContext.ts`.
- `ProgressProvider` dipasang di `main.tsx`; bar hijau 3px di atas layar, animasi maju bertahap lalu selesai.
- `AuthGate.tsx`: bar jalan saat memeriksa sesi & saat submit login.
- `App.tsx`: bar jalan tiap `activePage` berubah (buka menu).
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `fdae42f` Add green top progress bar for login and navigation (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

**Judul:** Pasang logo RSUD AMI + rombak tampilan login (tema hijau dashboard)

Rincian:
- `src/assets/logo-rsud-ami.png` dipakai sebagai logo di sidebar (`AppShell.tsx`) dan halaman login (`AuthGate.tsx`).
- `public/logo-rsud-ami.png` dipakai sebagai favicon & apple-touch-icon (`index.html`).
- `AuthGate.css`: latar halaman bergaya gradien hijau (`#173e36` → `#1f5a4a`) selaras sidebar dashboard; kartu login putih, sudut membulat, bayangan lembut, isi dipusatkan.
- `AuthGate.tsx`: judul `Masuk ke sistem` → `STANDAR PELAYANAN MINIMAL`; subjudul → `----Masukkan Email & Kata Sandi Anda----`; tombol `Masuk dengan aman` → `MASUK`; eyebrow `AKSES PENGGUNA` dihapus agar lebih sederhana.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `303e4a8` Apply RSUD AMI logo and redesign login page with green theme (sudah di-push ke `main`).

## Tugas sebelum (SELESAI)

**Judul:** Input laporan default ke bulan berjalan + aktifkan fitur unduh pada Rekap & Unduh

Rincian:
- Halaman input laporan saat dibuka otomatis memilih periode/bulan berjalan.
- Fitur unduh pada halaman Rekap diaktifkan (ekspor CSV).
- Perapian tata letak sidebar.

Commit terkait:
- `41fc40b` Default input to running period and tidy sidebar layout
- `0e045cb` Enable report download as CSV export

## Catatan proses (WAJIB)

- Setiap ada perubahan kode/file, `PROGRESS.md` DAN `AGENTS.md` harus diperbarui pada perubahan yang sama (lihat alur kerja di `AGENTS.md`).
- **Alur commit/push/deploy:** pengguna memerintahkan commit & push setelah fix lokal selesai → agen otomatis push ke `main` di GitHub → pengguna tinggal menjalankan **Actions → Deploy to GitHub Pages → Run workflow** di GitHub web. Jangan commit/push tanpa perintah eksplisit.

## Langkah berikutnya

- _Belum ada tugas berikutnya yang ditentukan._ Tambahkan di sini saat ada permintaan baru.

## Riwayat singkat (git)

- `41fc40b` Default input to running period and tidy sidebar layout
- `0e045cb` Enable report download as CSV export
- `6cd99f2` Connect app pages to Supabase and add unit & user management
- `bc669df` Initial project setup for SPM RSUD AMI
