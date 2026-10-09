# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-09
- **Kondisi working tree:** ada perubahan belum di-commit (rapikan tampilan menu Perubahan + fitur notifikasi lonceng)

## Tugas terakhir (BELUM DI-COMMIT)

**Judul:** Fungsi tombol notifikasi (lonceng) di topbar

Rincian:
- `src/components/layout/NotificationBell.tsx` (+ `.css`) BARU: dropdown notifikasi di topbar `AppShell`, badge jumlah (merah) untuk item `danger`/`warning`, klik item menuju halaman terkait, tutup saat klik di luar. Mode pratinjau menampilkan contoh notifikasi statis.
- Sumber data hanya dari tabel yang ada (tanpa migrasi/tabel baru): `report_periods`, `units`, `indicators`, `reports`, `report_entries`, `profiles`.
- Tiga jenis notifikasi (pilihan pengguna): (1) **Kelengkapan unit** — unit belum mengisi/belum lengkap pada periode berjalan (menuju `entry`); (2) **Indikator di bawah standar** — capaian vs `standard` (bandingkan angka pada `standard`, arah `≤` = batas atas, selain itu minimum), menuju `reports`; (3) **Periode & penguncian** — periode berjalan terkunci atau akan dikunci ≤ 7 hari (menuju `periods` untuk admin, selain itu `reports`).
- Cakupan unit mengikuti profil: `unit_id` diisi → hanya unit itu; kosong (admin/quality/leadership) → semua unit.
- `AppShell.tsx`: tombol lonceng statis diganti `<NotificationBell onNavigate={onNavigate} />`; impor `Bell` dipindah ke komponen.
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Belum di-commit; menunggu perintah commit & push.

## Tugas sebelumnya (BELUM DI-COMMIT)

**Judul:** Rapikan tampilan menu Perubahan (Audit)

Rincian:
- `AuditPage.tsx`: tidak lagi menampilkan UUID. `indicator_id`/`unit_id` di-resolve ke nama indikator/unit dan dipakai sebagai konteks pada judul (mis. "Entri indikator diperbarui · Waktu tanggap dokter").
- Hanya menampilkan field yang benar-benar berubah, dengan label ramah (Numerator, Denominator, Analisa, Catatan bukti, Periode) dan format `nilai lama → nilai baru`; judul + "Diubah oleh <nama>" tetap.
- `AuditPage.css`: `.audit-values` (dua kotak) diganti `.audit-changes` (satu blok teks).
- `data/demo.ts`: `demoAudit` disesuaikan ke bentuk baru (`title`, `changes`, `person`, `date`).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Belum di-commit; menunggu perintah commit & push.

## Tugas sebelumnya (SELESAI)

**Judul:** Akses menu & hak tulis sesuai peran

Rincian:
- `src/lib/access.ts` (BARU): peta `allowedPages(role, isPreview)`. officer = Ringkasan/Input/Rekap; unit_head, quality, leadership = + Indikator SPM; admin = semua; preview = semua.
- `src/auth/AuthContext.ts`: `AuthState` ditambah `role` dan `permissions`.
- `src/auth/AuthGate.tsx`: memuat `profiles.role` & `permissions` setelah sesi ada, menyediakannya lewat context.
- `src/components/layout/AppShell.tsx`: navigasi difilter per peran (grup kosong disembunyikan) + label peran di profil.
- `src/App.tsx`: halaman terlarang dialihkan ke Ringkasan (derivasi saat render, bukan efek).
- `src/features/users/UsersPage.tsx`: preset `permissions` per peran disamakan dengan spec (unit_head/quality/leadership dapat `manage_indicators`; quality/leadership `input_reports` true & `view_audit` false).
- `src/features/reports/InputReportPage.tsx`: pengguna `view_all_reports`/`manage_users` bisa input unit mana pun; petugas tetap hanya unit sendiri.
- Migrasi `supabase/migrations/202610090004_cross_unit_write.sql`: policy insert/update `reports` & `report_entries` juga mengizinkan `view_all_reports` (Mutu/Pimpinan menulis lintas unit).
- Keputusan: Pimpinan & Mutu punya menu Indikator SPM (lihat & edit), sama seperti Kepala unit; input laporan lintas unit karena tidak terikat unit.
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- **Perlu tindak lanjut pengguna:** jalankan migrasi `202610090004_cross_unit_write.sql` di Supabase SQL Editor.
- Permission profil lama (officer/unit_head/quality/leadership) **sudah dinormalkan** pengguna via `update public.profiles ... case role ...` (2026-10-09).
- Commit: `a6110d0` Add role-based menu access and cross-unit write for quality and leadership (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

**Judul:** Filter tahun + periode otomatis + baca lintas unit (tulis tetap unit sendiri)

Rincian:
- Task 1: `ReportsPage.tsx` — pilihan TAHUN diambil dari `report_periods` yang benar-benar ada (semua tahun, termasuk tahun lampau untuk audit), bukan lagi `tahunIni ± 1`; default ke tahun berjalan bila tersedia.
- Task 2: migrasi `supabase/migrations/202610090002_ensure_reporting_periods.sql` — fungsi `public.spm_ensure_periods()` (security definer) membuat periode Jan–Des tahun berjalan tanpa menghapus tahun lampau; dijadwalkan `pg_cron` `spm-ensure-periods` (best-effort).
- Task 3: migrasi `supabase/migrations/202610090003_cross_unit_read.sql` — RLS SELECT `reports`, `report_entries`, dan `indicators` aktif dibuka untuk semua `authenticated`; policy insert/update TIDAK diubah sehingga penulisan tetap terbatas unit sendiri (`manage_users` boleh semua unit).
- `InputReportPage.tsx`: dropdown unit menampilkan semua unit; unit selain milik profil ditampilkan **hanya-baca** (input & tombol simpan nonaktif) dengan catatan "Mode lihat saja".
- `App.tsx`: memanggil `spm_ensure_periods()` lalu `spm_lock_past_periods()` saat aplikasi dibuka.
- `README.md` & `AGENTS.md`: dokumentasi diperbarui (bagian "Akses baca dan tulis").
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Migrasi `202610090002` dan `202610090003` **sudah dijalankan** pengguna di Supabase SQL Editor (2026-10-09).
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `8d725da` Add cross-unit read, auto periods, and year filter from real periods (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

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

- Menunggu perintah pengguna untuk commit & push (mencakup rapikan menu Perubahan + notifikasi lonceng), lalu deploy via **Actions → Deploy to GitHub Pages → Run workflow**.

## Riwayat singkat (git)

- `a6110d0` Add role-based menu access and cross-unit write for quality and leadership
- `8d725da` Add cross-unit read, auto periods, and year filter from real periods
- `0805809` Tidy PROGRESS task history
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
