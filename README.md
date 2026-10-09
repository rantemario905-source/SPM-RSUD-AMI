# Pelaporan SPM RSUD AMI

Fondasi aplikasi pelaporan Standar Pelayanan Minimal berbasis React, TypeScript, Vite, dan Supabase. Kode fitur berada di `src/features`, komponen bersama di `src/components`, autentikasi di `src/auth`, dan stylesheet diletakkan dekat dengan modul yang menggunakannya. `index.html` hanya memuat metadata dan root aplikasi.

## Menjalankan lokal

1. Jalankan `npm install`.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari pengaturan proyek Supabase.
4. Untuk database baru, jalankan berurutan `supabase/migrations/202610060001_initial_spm_schema.sql`, `supabase/migrations/202610080001_connect_app_data.sql`, lalu `supabase/migrations/202610090001_auto_lock_past_periods.sql` melalui Supabase SQL Editor. Jangan jalankan migration 002 yang lama karena skemanya tidak cocok. Jika migration 002 pernah gagal setelah migration 001, jalankan dahulu fase pada `supabase/setup/01_repair_direct_entry_audit.sql`.
5. Buat akun pertama di Supabase Auth dan profil administrator melalui SQL tepercaya. Setelah login sebagai admin, gunakan halaman **Unit & pengguna** untuk menambah unit atau menautkan UID akun Auth lain ke profil.
6. Jalankan `npm run dev`.

Jika variabel Supabase belum diisi, aplikasi hanya membuka **mode pratinjau berisi data simulasi**. Mode tersebut bukan tempat memasukkan laporan sebenarnya.

## Keamanan

- Gunakan hanya Supabase publishable/anon key pada frontend. Jangan pernah menaruh `service_role` key atau kata sandi di kode atau file yang masuk Git.
- RLS pada migrasi membatasi laporan petugas ke unitnya; manajemen dapat melihat lintas unit sesuai peran. Perubahan laporan dan entri dicatat di `report_audit`.
- Nonaktifkan pendaftaran publik di Supabase Auth; akun dibuat oleh administrator. Profil yang berisi peran dan unit harus diprovisikan melalui proses admin tepercaya.
- Untuk GitHub Pages, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sebagai GitHub Actions secrets. Publishable/anon key memang dipakai di browser; RLS tetap wajib membatasi akses data.
- Jangan menyimpan nama, nomor rekam medis, atau identitas pasien. Gunakan data capaian agregat SPM.

## Deployment GitHub Pages

Deploy tidak berjalan otomatis saat upload/push file. Setelah file terbaru diunggah ke branch `main`, buka **Actions → Deploy to GitHub Pages → Run workflow** untuk menerbitkan versi tersebut. Aktifkan Pages dengan source **GitHub Actions** dan isi repository secrets `VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY`.

## Perintah

- `npm run dev` menjalankan server pengembangan.
- `npm run lint` menjalankan Oxlint.
- `npm run build` melakukan typecheck dan build produksi.

## Penguncian periode otomatis

Bulan yang sudah berakhir otomatis berubah menjadi `locked` lewat fungsi `public.spm_lock_past_periods()` (mengunci periode `open` yang `period_end` sudah lewat dan tidak dibuka manual). Penjadwalan harian memakai `pg_cron` (job `spm-lock-past-periods`). Jika `pg_cron` belum diaktifkan di proyek Supabase, aplikasi tetap memanggil fungsi tersebut setiap kali dibuka. Pengelola periode dapat membuka kembali bulan lampau lewat halaman **Periode**; pembukaan manual ditandai `manually_opened = true` agar tidak terkunci ulang otomatis.

Skema dan aturan RLS adalah fondasi awal; uji pada proyek Supabase non-produksi sebelum menghubungkan data RSUD.
