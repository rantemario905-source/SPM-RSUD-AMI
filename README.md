# Pelaporan SPM RSUD AMI

Fondasi aplikasi pelaporan Standar Pelayanan Minimal berbasis React, TypeScript, Vite, dan Supabase. Kode fitur berada di `src/features`, komponen bersama di `src/components`, autentikasi di `src/auth`, dan stylesheet diletakkan dekat dengan modul yang menggunakannya. `index.html` hanya memuat metadata dan root aplikasi.

## Menjalankan lokal

1. Jalankan `npm install`.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari pengaturan proyek Supabase.
4. Jalankan migrasi SQL dalam `supabase/migrations` melalui Supabase SQL Editor.
5. Buat pengguna melalui Supabase Auth, lalu tambahkan profil dan unit dengan peran yang sesuai.
6. Jalankan `npm run dev`.

Jika variabel Supabase belum diisi, aplikasi hanya membuka **mode pratinjau berisi data simulasi**. Mode tersebut bukan tempat memasukkan laporan sebenarnya.

## Keamanan

- Gunakan hanya Supabase publishable/anon key pada frontend. Jangan pernah menaruh `service_role` key atau kata sandi di kode atau file yang masuk Git.
- RLS pada migrasi membatasi laporan petugas ke unitnya; manajemen dapat melihat lintas unit sesuai peran. Perubahan laporan dan entri dicatat di `report_audit`.
- Nonaktifkan pendaftaran publik di Supabase Auth; akun dibuat oleh administrator. Profil yang berisi peran dan unit harus diprovisikan melalui proses admin tepercaya.
- Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sebagai GitHub Actions secrets/variables. Variabel frontend bukan pengganti RLS; kebijakan database tetap menjadi batas keamanan.
- Jangan menyimpan nama, nomor rekam medis, atau identitas pasien. Gunakan data capaian agregat SPM.

## Deployment GitHub Pages

Workflow `.github/workflows/deploy.yml` membangun dan menerbitkan aplikasi ketika ada push ke branch `main`. Tambahkan dua repository secrets bernama `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, lalu aktifkan Pages dengan source **GitHub Actions**. Jika branch utama bukan `main`, sesuaikan pemicu workflow.

## Perintah

- `npm run dev` menjalankan server pengembangan.
- `npm run lint` menjalankan Oxlint.
- `npm run build` melakukan typecheck dan build produksi.

Skema dan aturan RLS adalah fondasi awal; uji pada proyek Supabase non-produksi sebelum menghubungkan data RSUD.
