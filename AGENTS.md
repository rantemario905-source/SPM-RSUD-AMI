# AGENTS.md — Panduan Kerja Proyek SPM RSUD AMI

Dokumen ini dibaca otomatis oleh agen/editor di awal sesi. Isinya konteks proyek, konvensi, dan cara melanjutkan pekerjaan. **Selalu baca `PROGRESS.md` juga** sebelum mulai bekerja.

## Ringkasan proyek

Aplikasi pelaporan Standar Pelayanan Minimal (SPM) RSUD, dibangun dengan:

- React 19 + TypeScript + Vite 8
- Supabase (auth + database, RLS aktif)
- Oxlint untuk lint
- lucide-react untuk ikon

## Struktur direktori

- `src/App.tsx` — router sederhana berbasis state (`AppPage`), memetakan halaman ke komponen fitur.
- `src/features/` — kode per fitur: `dashboard`, `reports`, `indicators`, `audit`, `settings`, `users`.
- `src/components/` — komponen bersama: `layout/AppShell`, `layout/NotificationBell` (dropdown notifikasi di topbar), dan `feedback/ProgressBar` (top progress bar hijau global via `ProgressProvider` + hook `useProgress`).
- `src/auth/` — autentikasi. Tampilan login memakai tema hijau selaras dashboard (`--forest` / `#173e36`).
- `src/assets/` — aset yang di-bundle Vite (mis. `logo-rsud-ami.png` untuk UI).
- `public/` — aset statis disajikan di root (mis. `logo-rsud-ami.png` untuk favicon).
- `src/types/` — tipe bersama (mis. `AppPage`, tipe SPM).
- `src/data/` — data/konstanta.
- `src/styles/` — stylesheet global (`app.css`).
- `supabase/migrations/` — migrasi database (urutannya penting, lihat README).
- `supabase/setup/` — skrip perbaikan/setup manual.

## Konvensi

- Stylesheet diletakkan dekat modul pengguna (mis. `ReportsPage.css` di sebelah `ReportsPage.tsx`).
- Setiap halaman fitur = 1 komponen `*.tsx` dengan `PascalCase`.
- **Jangan tambahkan komentar pada kode** kecuali diminta.
- Jangan pernah menaruh `service_role` key atau kata sandi di kode/Git. Hanya publishable/anon key di frontend.
- Jangan simpan data identitas pasien; hanya capaian agregat SPM.
- Ikuti pola yang sudah ada pada fitur tetangga sebelum membuat pola baru.
- Akses data: semua pengguna terautentikasi boleh **membaca** laporan/entri semua unit, tetapi hanya boleh **menulis** untuk unit pada profilnya (`manage_users`/`view_all_reports` boleh semua unit). UI Input laporan menampilkan semua unit, unit lain hanya-baca.
- Akses menu per peran ada di `src/lib/access.ts` (`allowedPages`): officer = Ringkasan/Input/Rekap; unit_head & quality & leadership = + Indikator SPM; admin = semua. `AppShell` memfilter navigasi dan `App.tsx` mengalihkan halaman terlarang ke Ringkasan. `role` & `permissions` disediakan `AuthGate` lewat `AuthContext`.
- Periode laporan: `public.spm_ensure_periods()` membuat periode tahun berjalan otomatis (tanpa menghapus tahun lampau), dan `public.spm_lock_past_periods()` mengunci bulan lampau (dipanggil `pg_cron`/saat app dibuka). Pembukaan manual oleh pengelola menandai `report_periods.manually_opened = true` agar tidak terkunci ulang. Filter tahun di Rekap bersumber dari periode nyata.
- Notifikasi (`NotificationBell`) dihitung di klien dari tabel yang ada (tanpa tabel/migrasi baru): kelengkapan unit pada periode berjalan, capaian indikator di bawah `indicators.standard` (bandingkan angka pada teks standar: arah `≤` = batas atas, selain itu minimum), dan penguncian periode (terkunci/akan terkunci ≤ 7 hari). Cakupan unit mengikuti `profiles.unit_id` (kosong = semua unit). Mode pratinjau memakai data contoh.

## Perintah

- `npm run dev` — server pengembangan.
- `npm run lint` — Oxlint (jalankan setelah perubahan).
- `npm run build` — typecheck (`tsc -b`) + build produksi.
- Verifikasi wajib setelah mengubah kode: `npm run lint` dan `npm run build`.

## Alur kerja agen

1. Baca `PROGRESS.md` untuk status pekerjaan terakhir.
2. Periksa `git log --oneline -10` dan `git status` untuk konteks.
3. Kerjakan tugas, verifikasi dengan lint + build.
4. **WAJIB: Setiap ada perubahan kode/file, perbarui `PROGRESS.md` DAN `AGENTS.md`** (tanggal, status tugas, keputusan/konvensi baru, langkah berikutnya). Jangan anggap tugas selesai sebelum kedua file ini diperbarui.
5. Jangan commit/push kecuali diminta eksplisit oleh pengguna.

## Alur commit, push, dan deploy

1. Setelah pekerjaan selesai dan diverifikasi di lokal, pengguna akan memerintahkan commit & push.
2. Setelah diperintahkan, lakukan `git add`, `git commit`, lalu `git push` ke `main` (tanpa mengubah config git, tanpa force-push).
3. Push ke GitHub bersifat otomatis begitu diperintahkan.
4. **Deploy GitHub Pages tidak otomatis saat push.** Pengguna menjalankan **Actions → Deploy to GitHub Pages → Run workflow** di GitHub web.
5. Jangan commit/push tanpa perintah eksplisit dari pengguna.
