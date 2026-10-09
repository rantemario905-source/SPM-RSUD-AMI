# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-09
- **Kondisi working tree:** ada perubahan belum di-commit (ganti logo RSUD AMI + perombakan tampilan login)

## Tugas terakhir (BELUM DI-COMMIT)

**Judul:** Rombak tampilan halaman login (tema hijau dashboard)

Rincian:
- `AuthGate.css`: latar halaman bergaya gradien hijau (`#173e36` → `#1f5a4a`) selaras sidebar dashboard; kartu login putih, sudut membulat, bayangan lembut, isi dipusatkan.
- `AuthGate.tsx`: judul `Masuk ke sistem` → `STANDAR PELAYANAN MINIMAL`; subjudul → `----Masukkan Email & Kata Sandi Anda----`; tombol `Masuk dengan aman` → `MASUK`; eyebrow `AKSES PENGGUNA` dihapus agar lebih sederhana.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Belum di-commit; menunggu perintah commit & push dari pengguna.

## Tugas sebelumnya (BELUM DI-COMMIT)

**Judul:** Ganti logo lama dengan logo RSUD AMI

Rincian:
- `src/assets/logo-rsud-ami.png` dipakai sebagai logo di sidebar (`AppShell.tsx`) dan halaman login (`AuthGate.tsx`).
- `public/logo-rsud-ami.png` dipakai sebagai favicon & apple-touch-icon (`index.html`).
- `AppShell.css` menyesuaikan `.brand-mark img`; `AuthGate.css` menyesuaikan `.login-mark img`.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.

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
