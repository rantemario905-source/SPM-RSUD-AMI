# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-09
- **Kondisi working tree:** bersih (semua perubahan sudah di-commit & push)

## Tugas terakhir (SELESAI)

**Judul:** Penguncian otomatis bulan lampau + pembukaan oleh admin

Rincian:
- Migrasi `supabase/migrations/202610090001_auto_lock_past_periods.sql`: kolom `report_periods.manually_opened`, fungsi `public.spm_lock_past_periods()` (security definer), jadwal `pg_cron` `spm-lock-past-periods`.
- `App.tsx`: memanggil `rpc('spm_lock_past_periods')` tiap aplikasi dibuka (fallback bila pg_cron tidak aktif).
- `PeriodsPage.tsx`: tombol Buka/Kunci hanya tampil untuk `admin`/permission `manage_periods`; membuka periode menandai `manually_opened = true` agar tidak terkunci ulang.
- `README.md`: dokumentasi migrasi 003 + bagian penguncian otomatis.
- Migrasi 003 **sudah dijalankan** pengguna di Supabase SQL Editor (2026-10-09).
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `3c93150` Auto-lock past reporting periods and allow admin reopen.

## Tugas sebelumnya (SELESAI)

**Judul:** Hapus kartu metrik "Periode terkunci" di Ringkasan

Rincian:
- Kartu dianggap tidak penting/duplikat dengan panel "Perlu perhatian" & kolom KONDISI.
- `DashboardPage.tsx`: hapus `<article>` kartu + properti `locked` dari state `totals`.
- `DashboardPage.css`: `.metric-grid` dari 4 → 3 kolom.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `d158552` Remove locked-period metric card from dashboard.

## Tugas sebelumnya (SELESAI)

**Judul:** Hapus unit terdaftar & profil pengguna oleh admin

Rincian:
- `UsersPage.tsx`: kolom `AKSI` + tombol hapus (`Trash2`) di tabel unit terdaftar & profil pengguna.
- Tombol hanya tampil bila pengguna berperan `admin` atau punya permission `manage_users`.
- Aksi hapus pakai `window.confirm`, `delete()` ke tabel `units`/`profiles`, lalu memperbarui daftar & pesan sukses/galat.
- Hapus profil hanya melepas baris profil (akun Auth tidak dihapus); RLS & FK tetap menjaga integritas.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `e74fcf2` Allow admins to delete units and user profiles.

## Tugas sebelumnya (SELESAI)

**Judul:** Perbaikan teks halaman Unit & pengguna

Rincian:
- Hapus catatan `Buat akun terlebih dahulu di Supabase Authentication...` beserta impor `CircleAlert` di `UsersPage.tsx`.
- Label `UID pengguna Auth` → `UID Pengguna`; placeholder `UUID dari Supabase Auth` → `Masukan UID`.
- Commit: `5a2c04d` Simplify Unit and user management copy.

## Tugas sebelumnya (SELESAI)

**Judul:** Top progress/loading bar hijau saat login & buka menu

Rincian:
- Komponen `src/components/feedback/ProgressBar.tsx` (+ `ProgressBar.css`) dan hook `src/components/feedback/progressContext.ts`.
- `ProgressProvider` dipasang di `main.tsx`; bar hijau 3px di atas layar.
- `AuthGate.tsx`: bar jalan saat memeriksa sesi & submit login. `App.tsx`: bar jalan tiap `activePage` berubah.
- Commit: `fdae42f` Add green top progress bar for login and navigation.

## Tugas sebelumnya (SELESAI)

**Judul:** Pasang logo RSUD AMI + rombak tampilan login (tema hijau dashboard)

Rincian:
- `src/assets/logo-rsud-ami.png` dipakai di sidebar (`AppShell.tsx`) dan halaman login (`AuthGate.tsx`).
- `public/logo-rsud-ami.png` sebagai favicon & apple-touch-icon (`index.html`).
- `AuthGate.css`: latar gradien hijau (`#173e36` → `#1f5a4a`); kartu login putih dipusatkan.
- `AuthGate.tsx`: judul → `STANDAR PELAYANAN MINIMAL`; subjudul → `----Masukkan Email & Kata Sandi Anda----`; tombol → `MASUK`.
- Commit: `303e4a8` Apply RSUD AMI logo and redesign login page with green theme.

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

- `e8baccb` Update PROGRESS for delete, dashboard, and period locking
- `3c93150` Auto-lock past reporting periods and allow admin reopen
- `d158552` Remove locked-period metric card from dashboard
- `e74fcf2` Allow admins to delete units and user profiles
- `c1fdd08` Update PROGRESS after progress bar and users copy
- `5a2c04d` Simplify Unit and user management copy
- `fdae42f` Add green top progress bar for login and navigation
- `303e4a8` Apply RSUD AMI logo and redesign login page with green theme
- `41fc40b` Default input to running period and tidy sidebar layout
- `0e045cb` Enable report download as CSV export
- `6cd99f2` Connect app pages to Supabase and add unit & user management
- `bc669df` Initial project setup for SPM RSUD AMI
