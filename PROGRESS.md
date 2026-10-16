# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-16
- **Kondisi repo:** `main` sinkron dengan `origin/main`, HEAD **`92c6166`** (*Update PROGRESS after print clipping fix commit*) — **sudah di-push & ter-deploy** (run #35). Deploy ini membawa **Ringkasan semua unit** (`ef4dfc4`) + **perbaikan cetak** (`62cfdf5`).
- **Deploy terakhir:** Actions → Deploy to GitHub Pages **run #35** (head `92c6166`, conclusion `success`, 2026-10-16 01:12 UTC). Sebelumnya: run #34 (`0d4c089`, Ringkasan semua unit), run #33 (`573dae1`, topbar/routing), run #32 (`36e7c56`), run #31 (`061d5e4`), run #30 (`784e4e5`), run #29 (`e67ac21`).
- **Situs live:** menyajikan `assets/index-DI1TSi8h.js` + `assets/index-C75_m8ZO.css` (bundle baru; sebelumnya `index-CThM4i0c.js` + `index-DBTFti1m.css`). Verifikasi: hash CSS live **identik** dengan build lokal; isi blok `@media print` live memuat reset kita — `.app-frame{height:auto!important;min-height:0!important;…;overflow:visible!important}`, `.main-column{height:auto!important;…;overflow:visible!important}`, `.page-content{…;height:auto!important;max-height:none!important;…;overflow:visible!important}` → perbaikan cetak **live**; **2× `sb_publishable_`**, **0× `eyJ…`**. Hash JS beda wajar karena CI memakai `base: '/SPM-RSUD-AMI/'`.
- **Verifikasi sesi ini:** `npm run lint` ✓ (tanpa warning), `npm test` ✓ (**38 lolos**, 1 todo), `npm run build` ✓ (`dist/assets/index-1hveh2I-.js` + `index-B6lgt_Ho.css`). Bundle live dicek isinya: memuat `unit_id.is.null` & `unit_ids` (logika scoping), **2× `sb_publishable_`**, **0× `eyJ…`**. Hash JS lokal beda dari live wajar: `vite.config.ts` memakai `base: '/SPM-RSUD-AMI/'` saat `GITHUB_ACTIONS=true` sedangkan lokal `/` (hash CSS justru identik: `index-B6lgt_Ho.css`).
- **Menunggu dari pengguna (uji fungsional manual):** login sebagai **Kepala Instalasi** (`unit_head`) → halaman Indikator SPM hanya menampilkan unitnya (+ indikator global); **Unit & pengguna** tidak lagi memuat akun Mutu; **Ringkasan** tetap menampilkan semua indikator.
- **Label peran (tampilan):** `unit_head` → **Kepala Instalasi**, `officer` → **Kepala Ruangan** (`553ba4a`) — **sudah ter-deploy** (run #31+). Kode peran di DB tidak berubah.
- **Perbaikan bug izin akses→menu (`ab06e73`) — sudah ter-deploy** (run #32+): izin akses kini **menggerakkan menu** (`allowedPages(role, permissions, isPreview)` di `src/lib/access.ts`) + `edit_locked_periods` di `InputReportPage` + tes `tests/access.test.ts`.
- **Pekerjaan topbar/routing SUDAH di-commit, di-push, & ter-deploy (`30c706d`+`573dae1`, run #33):** (1) **routing hash** agar tombol Back/Forward menelusuri menu lalu kembali ke layar login — `src/lib/routes.ts`, `src/lib/router.tsx`, `src/lib/routerContext.ts`, `main.tsx`, `AuthGate.tsx`, `App.tsx`; (2) **sidebar menetap** di desktop + hanya konten kanan bergulir (`AppShell.css`); (3) **menu pengguna** dipindah ke topbar dengan badge nama peran (hijau muda), avatar, dan nama dari `profiles.full_name`, dropdown **Log Out** (`src/components/layout/UserMenu.tsx`/`.css`, `AuthContext.fullName`). Penyesuaian lanjutan: **notifikasi paling kanan**, label `SESI AKTIF` dihapus (pill kini hanya `MODE PRATINJAU`), badge teks `Role` dihapus, blok `Sesi terlindungi / Pengguna terautentikasi` dihapus, **chip avatar+nama diberi garis 3D** dengan jarak presisi (**8px** antar aksi, 10px peran→chip, 9px dalam chip), tombol notifikasi 36×36 dibuat **bulatan 3D** seragam, dan dropdown **beranimasi** (panel meluncur turun dari avatar + item Log Out menyusul, hanya transform/opacity, dimatikan saat `prefers-reduced-motion`). Verifikasi lokal: lint ✓ (tanpa warning), `npm test` ✓ (**56 lolos**, 1 todo), `npm run build` ✓ (`index-BHVZOD8u.js` + `index-DBTFti1m.css`).

- **Ringkasan = menu monitoring semua unit (`DashboardPage`) — SUDAH di-commit, di-push, & ter-deploy (`ef4dfc4`, run #34; ikut run #35) (2026-10-16):** semua pengguna (termasuk `officer`/`unit_head`) kini melihat **semua unit** di Ringkasan. Scope unit dihapus dari `DashboardPage` (tidak lagi memakai `loadProfile`/`scopedUnitIds`) — tanpa perubahan DB (RLS baca lintas unit sudah ada). Verifikasi lokal: lint ✓ (tanpa warning), `npm test` ✓ (**56 lolos**, 1 todo), `npm run build` ✓ (`index-B8kGQ4ip.js` + `index-DBTFti1m.css`).

- **Perbaikan cetak "Cetak semua unit" terpotong 1 halaman — SUDAH di-commit, di-push, & ter-deploy (`62cfdf5`, run #35) (2026-10-16):** akar masalah = aturan sidebar menetap `@media (min-width: 681px)` (`.app-frame{height:100vh;overflow:hidden}`, `.main-column{height:100vh}`, `.page-content{overflow-y:auto}`) ikut berlaku di media cetak dan **tidak** di-reset oleh blok `@media print` lama → hasil cetak terpotong setinggi 1 viewport halaman. Perbaikan di `ReportsPage.css`: kontainer layout diberi `height:auto`/`overflow:visible` di blok print. Verifikasi harness headless: 1 → 9 halaman. Lokal: lint ✓, `npm test` ✓ (56 lolos, 1 todo), `npm run build` ✓ (`index-C75_m8ZO.css` + `index-qM3EKnoF.js`).

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH, & TER-DEPLOY (`62cfdf5`, run #35) — perbaikan bug: cetak "Cetak semua unit" terpotong 1 halaman, 2026-10-16)

**Gejala (pengguna):** menekan **Cetak semua unit** menghasilkan cetakan **hanya 1 halaman dan terpotong**; harusnya memuat semua unit sampai blok tanda tangan di akhir.

**Loop diagnosis (dibangun sebelum berhipotesis, di luar repo):** harness DOM/CSS berstruktur sama (`C:\Users\TEMP\AppData\Local\Temp\opencode\printbug\`; `harness.html` + `count.ps1`), 3 unit × 30 baris, dijalankan dengan Chrome headless `--print-to-pdf`, jumlah halaman dihitung dari PDF.
- Sebelum perbaikan: `PAGES=1` — **merah**, persis gejala pengguna.
- Uji diferensial (hanya melepas `height:100vh`/`overflow` pada print, variabel lain tetap): `PAGES=9` → hipotesis terkonfirmasi.
- Sesudah perbaikan (memakai CSS hasil `npm run build`): `PAGES=9` — **hijau**; dokumen pendek (1 unit, 5 baris) tetap `PAGES=1` (tidak ada halaman kosong).

**Hipotesis yang benar (akar masalah):** aturan **sidebar menetap** `@media (min-width: 681px)` di `AppShell.css` juga cocok pada media cetak (lebar halaman landscape ≥ 681px). Blok `@media print` lama hanya mengatur `display`/`padding` dan **tidak** me-reset tinggi/overflow, sehingga konten terpotong setinggi satu viewport halaman → 1 halaman. Regresi tak sengaja dari perubahan sidebar menetap 2026-10-14; **juga** memengaruhi **Cetak PDF** satu unit (bukan hanya cetak semua unit).

**Perbaikan (`src/features/reports/ReportsPage.css`, blok `@media print`):** `.app-frame`, `.main-column`, `.page-content` diberi `height: auto !important` + `overflow: visible !important` (+ `min-height: 0` pada `.app-frame`, `max-height: none` pada `.page-content`). Struktur cetak & blok tanda tangan tidak diubah — sesuai rancangan awal.

**Seam uji regresi:** tidak ada seam layout-cetak di vitest/jsdom (jsdom tidak menghitung paginasi), jadi tidak ada tes kode; dijaga lewat catatan invariant di `AGENTS.md` + harness headless di luar repo.

**Verifikasi repo:** lint ✓ (tanpa warning), `npm test` ✓ (**56 lolos**, 1 todo), `npm run build` ✓ (`index-C75_m8ZO.css` + `index-qM3EKnoF.js`). Tanpa perubahan DB.

**Langkah berikutnya:** sudah **live** (run #35, `index-DI1TSi8h.js` + `index-C75_m8ZO.css`). Sisa opsional: uji manual di situs live — **Cetak semua unit** (pratinjau: semua unit + tanda tangan, banyak halaman, tidak terpotong) dan **Cetak PDF** satu unit.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH, & TER-DEPLOY (`ef4dfc4`+`0d4c089`, run #34/#35) — Ringkasan jadi menu monitoring semua unit, 2026-10-16)

**Judul:** Ringkasan menampilkan semua unit & indikator untuk semua pengguna (2026-10-16)

Permintaan pengguna: Ringkasan saat ini hanya menampilkan indikator sesuai unit yang diakses; diinginkan **semua pengguna melihat semua indikator** di Ringkasan agar menjadi **menu monitoring** kelengkapan & capaian setiap unit RSUD AMI.

Rincian implementasi:
- Penyaring tunggal ada di `src/features/dashboard/DashboardPage.tsx` (efek pemuat: `scopedUnitIds(profile)` → `scopedUnits`). **Dihapus**: impor `loadProfile`/`scopedUnitIds` dicabut; efek jadi `Promise.all([loadUnits(client), loadPeriods(client)])` + `setUnits(allUnits)` (semua unit, tanpa filter). Sisanya (query `reports`/`report_entries`, hitung kelengkapan/capaian per unit, metrik, tabel, panel) tidak berubah karena sudah generik terhadap `units`.
- **Tanpa perubahan skema/RLS/migrasi:** baca sudah lintas unit — `reports`/`report_entries` SELECT `using (true)` (`202610090003_cross_unit_read.sql`); `indicators` aktif lintas unit boleh dibaca (`202610150001`); `loadIndicators(supabase)` memang tanpa filter unit.
- Hanya baca → **hak tulis tetap dibatasi unit** (tombol Input → `InputReportPage` yang masih UI + RLS `spm_has_unit`).
- Keputusan pengguna (2026-10-16): cakupan **hanya Ringkasan** (Notifikasi/Indikator/Rekap/Perubahan tidak diubah); daftar unit **ditampilkan semua** (mengikuti scroll halaman, tanpa batas tinggi internal).
- Verifikasi: lint ✓ (tanpa warning), `npm test` ✓ (**56 lolos**, 1 todo), `npm run build` ✓ (`index-B8kGQ4ip.js` + `index-DBTFti1m.css`). Tanpa perubahan DB.

**Langkah berikutnya:** sudah **live** (run #34/#35). Sisa opsional: uji Ringkasan sebagai `officer` di situs live (harus menampilkan semua unit).

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH, & TER-DEPLOY `30c706d`+`573dae1`, run #33 — routing Back, sidebar menetap, menu pengguna di topbar)

**Judul:** Tombol Back browser + sidebar menetap + panel pengguna pindah ke kanan atas (2026-10-14)

Permintaan pengguna:
1. Tombol **Back** browser langsung keluar dari situs; diinginkan Back menelusuri menu lalu kembali ke layar login (bandingkan dengan situs lain).
2. Menu kiri harus **permanen** (tidak bergeser saat scroll); hanya konten kanan yang bergulir.
3. Panel nama pengguna (dulu kiri bawah) dipindah ke **kanan atas** → nama saja (mis. `AGUS HIDAYAT`) dengan avatar di kiri, plus **badge nama peran** (latar hijau muda); klik nama → menu kecil berisi **Log Out**.
   **Revisi lanjutan pengguna (2026-10-14):** ikon **notifikasi** harus di **paling kanan** topbar; hapus label `SESI AKTIF`; hapus badge teks `Role` (sisakan nama perannya); hapus blok **"Sesi terlindungi / Pengguna terautentikasi"** di kiri bawah.

Akar masalah #1: aplikasi SPA tanpa routing — navigasi hanya state React (`AppPage`), tak ada entri riwayat, sehingga Back keluar situs. Keputusan pengguna: **Opsi 1** (menu → layar login).

Rincian implementasi:
- **Routing hash:** `src/lib/routes.ts` (`routeHashes`, `routeFromHash`, `hashForRoute`, `isAppPage`; rute `#/dashboard`…`#/users` + `#/login`); `src/lib/router.tsx` (`RouterProvider`, `pushState`/`replaceState` + listener `popstate`/`hashchange`); `src/lib/routerContext.ts` (`useRouter`); `main.tsx` memasang `RouterProvider` di atas `AuthGate`.
- **AuthGate:** muat `full_name`; tanpa sesi → `#/login`; sesi aktif + rute `login` → tampilkan layar login **tanpa logout** (tujuan Back); login sukses → `pushState` `#/dashboard`; saat sesi bertahan (refresh) menyisipkan entri `#/login` di belakang halaman aktif (guard `loading` agar tidak salah tampil login).
- **App.tsx:** halaman dari `route` (`useRouter`), guard izin tak diizinkan → Ringkasan; `onNavigate` = `navigate`.
- **AppShell.css:** blok `@media (min-width: 681px)` mengunci `.app-frame`/`.sidebar`/`.main-column` `100vh`; hanya `.page-content` `overflow-y: auto`.
- **UserMenu:** `src/components/layout/UserMenu.tsx` (+`.css`) menggantikan `profile-button` di `.sidebar-bottom`; badge **nama peran** (hijau muda) + **chip `.user-chip` bergaris 3D** berisi avatar inisial + nama (`AuthContext.fullName`, fallback email) + chevron; dropdown **Log Out** → `ConfirmDialog` yang ada. `AuthContext`/`AuthGate` menyediakan `fullName`. Urutan `.topbar-actions`: pill `MODE PRATINJAU` (hanya pratinjau) → UserMenu → **NotificationBell (paling kanan)**. Catatan "Sesi terlindungi" di kiri bawah + badge teks `Role` dihapus. Jarak presisi: `gap` **8px** antar aksi (dirapatkan dari 14px agar avatar/nama lebih dekat ke notifikasi), 10px peran→chip, 9px dalam chip (avatar→nama→caret); tombol notifikasi 36×36 dibuat **bulatan 3D** seragam dengan chip (gradien putih + border + inner highlight + drop shadow, `border-radius: 50%`). Animasi buka dropdown: panel meluncur turun dari avatar (`user-menu-slide`, `transform-origin: top right`, 170ms) + item Log Out menyusul (`user-menu-item-in`, delay 70ms), hanya transform/opacity, dimatikan saat `prefers-reduced-motion`.
- **Tes:** `tests/routes.test.ts` (4) + `tests/router.test.tsx` (4).
- Verifikasi: lint ✓, test ✓ (**56 lolos**, 1 todo), build ✓ (`index-BhUmXZlI.js` + `index-D4nsHPcO.css`). Tanpa perubahan DB/migrasi.

**Langkah berikutnya:** sudah **live** (run #33, bundle `index-CThM4i0c.js`). Sisa opsional: uji fungsional manual di situs live (Back/Forward → layar login; sidebar menetap; animasi dropdown; notifikasi bulat 3D).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH `ab06e73`; MENUNGGU DEPLOY — perbaikan bug: izin akses kini menggerakkan menu)

**Judul:** Bug izin akses tidak berpengaruh — menu kini mengikuti izin (gabungan peran + izin) (2026-10-14)

Laporan pengguna: setelah menambah izin (mis. **Kelola indikator SPM** dan **Edit periode terkunci**) pada akun **Kepala Ruangan** (`officer`) lalu disimpan, saat login akun itu tidak ada perubahan apa pun.

**Akar masalah (dikonfirmasi probe test merah 3/3):** `allowedPages(role, isPreview)` di `src/lib/access.ts` **hanya melihat peran**, tidak membaca `permissions`. Akibatnya izin `manage_indicators`, `manage_periods`, `view_audit`, `manage_users`, `view_all_reports` tidak membuka menu apa pun; `edit_locked_periods` bahkan **tidak pernah dibaca di UI** (hanya di RLS). Padahal di sisi database (RLS) izin-izin itu sudah ditegakkan — jadi ini celah penjagaan di UI, bukan data. Keputusan pengguna (Opsi A): menu = halaman dasar peran **digabung** halaman dari izin.

Rincian:
- `src/lib/access.ts`: tanda tangan baru `allowedPages(role, permissions, isPreview)` + `canAccessPage(role, permissions, isPreview, page)`; peta `permissionPages` — `manage_indicators`→`indicators`, `manage_periods`→`periods`, `view_audit`→`audit`, `manage_users`→`users`, `view_all_reports`→`crossunit`; hasil digabung dengan `rolePages` dan dideduplikasi.
- Pemanggil diperbarui: `src/App.tsx` (memo), `src/components/layout/AppShell.tsx` (`visiblePages`), `src/features/reports/ReportsPage.tsx` (`canPrintAllUnits`).
- `src/features/reports/InputReportPage.tsx`: `edit_locked_periods` kini dihormati — `canEditLocked`, `lockedReadOnly` menggantikan `isLocked` pada penguncian input & tombol simpan; teks banner periode terkunci menyesuaikan ("Anda memiliki akses khusus untuk mengoreksi periode terkunci."). (Insert entri baru pada periode terkunci tetap ditolak RLS; yang diizinkan adalah koreksi entri yang sudah ada.)
- Tes baru `tests/access.test.ts` (10 kasus) mengunci pemetaan izin→menu.
- Catatan: perubahan izin berlaku setelah pengguna tersebut **login kembali** (profil dimuat saat login).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm test` ✓ (**48 lolos**, 1 todo), `npm run build` ✓ (`dist/assets/index-CHfnm_Hw.js`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH `553ba4a`; MENUNGGU DEPLOY — ganti label peran Kepala Instalasi / Kepala Ruangan)

**Judul:** Ganti label peran tampilan: `unit_head` → **Kepala Instalasi**, `officer` → **Kepala Ruangan** (2026-10-14)

Permintaan pengguna: mengganti nama tampilan peran — "Kepala unit" menjadi **Kepala Instalasi** dan "Petugas unit" menjadi **Kepala Ruangan**. **Kode peran di DB tidak berubah** (`unit_head`/`officer`), hanya label yang dilihat pengguna.

Rincian:
- `src/components/layout/AppShell.tsx` & `src/features/users/UsersPage.tsx`: peta `roleNames` → `officer: 'Kepala Ruangan'`, `unit_head: 'Kepala Instalasi'` (muncul di label peran sidebar profil serta tabel/filter pengguna di **Unit & pengguna**).
- `README.md`: tabel peran diperbarui — baris `Petugas unit (officer)` → **Kepala Ruangan**, `Kepala unit (unit_head)` → **Kepala Instalasi**.
- `AGENTS.md`: catatan konvensi label peran ditambahkan (kode peran tetap; hanya tampilan).
- Tanpa perubahan DB/migrasi/RLS.
- Verifikasi: `npm run lint` ✓, `npm test` ✓ (**38 lolos**, 1 todo), `npm run build` ✓ (`dist/assets/index-BXQZqDAu.js`; CSS tetap `index-B6lgt_Ho.css`). Bundle hasil build dicek: `Kepala Instalasi` 4×, `Kepala Ruangan` 4×, `Kepala unit`/`Petugas unit` **0×**.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY — scoping Indikator SPM per unit + hapus peran quality)

**Judul:** Batasi halaman Indikator SPM ke unit pengguna + hapus peran Mutu (`quality`) (2026-10-14)

Permintaan pengguna: halaman **Indikator SPM** hanya menampilkan indikator unit yang diakses pengguna (bukan semua unit). **Ringkasan tidak diubah** (tetap melihat semua indikator — jawaban pengguna). Keputusan tambahan: peran **Mutu (`quality`) dihapus total** (hasil diskusi dengan atasan); batas tulis ditegakkan di RLS; profil quality lama **dihapus**; indikator global (`unit_id` kosong) tetap tampil untuk user ber-unit.

Rincian:
- `src/lib/spm-data.ts`: `loadIndicators(client, unitId?)` kini menerima `string | string[]`; untuk array memakai `.or('unit_id.is.null,unit_id.in.(…)')` sehingga indikator global ikut.
- `src/features/indicators/IndicatorsPage.tsx`: memuat `loadProfile`; `scopedUnitIds(profile)` → `units` difilter ke scope; indikator dimuat via scope; dropdown filter, dropdown unit di form, ringkasan **Unit terdaftar**, dan default unit form mengikuti unit scope (default = unit utama profil). Helper `canWriteIndicator` → baris di luar cakupan tidak bisa diedit (toggle `disabled` + tombol aksi `—`). `leadership`/`admin` (tanpa unit) tetap melihat & mengelola semua.
- `src/features/indicators/IndicatorsPage.css`: gaya `.indicator-readonly` dan `.active-toggle.is-readonly`.
- **Peran `quality` dihapus:** `src/lib/access.ts` (entri dihapus — `crossunit` kini hanya `leadership`/`admin`), `src/components/layout/AppShell.tsx` (label peran), `src/features/users/UsersPage.tsx` (`UserRole`, `roleNames`, `rolePermissions`, `baseRoles`), `tests/UsersPage.test.tsx` (uji "tanpa izin" memakai `leadership`), `README.md` (baris tabel Mutu + catatan kelola indikator + daftar migrasi), `AGENTS.md`.
- Migrasi baru `supabase/migrations/202610150001_scope_indicators_and_drop_quality.sql`: lepaskan referensi FK ke profil quality (`report_periods.updated_by` dikosongkan; `reports.created_by` yang NOT NULL dialihkan ke administrator pertama agar laporan tidak hilang) → `delete from public.profiles where role = 'quality'` → check `profiles_role_check` dipersempit ke `('admin','officer','unit_head','leadership')`; policy SELECT & `for all` pada `indicators` diganti — baca indikator aktif lintas unit tetap terbuka (agar Input laporan tetap menampilkan unit lain) tetapi kelola dibatasi `spm_has_unit(unit_id)` kecuali `view_all_reports`/`manage_users`. **Sudah dijalankan pengguna (sukses) 2026-10-14** (percobaan pertama gagal: kolom `reports.updated_by` tidak ada; migrasi diperbaiki memakai `report_periods.updated_by` + pengalihan `reports.created_by`, lalu berhasil).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm test` ✓ (**38 lolos**, 1 todo), `npm run build` ✓ (`dist/assets/index-1hveh2I-.js`).
- **Deploy (sesi lanjutan):** Actions → Deploy to GitHub Pages **run #30** (head `784e4e5`) conclusion `success` (2026-10-14 13:29 UTC). Situs live menyajikan `assets/index-CkZ7ZXKN.js`; isi bundle memuat `unit_id.is.null`/`unit_ids` dan `sb_publishable_` (2×) tanpa `eyJ…` (0×). Sisa uji fungsional login manual (unit head/global/Ringkasan) diserahkan ke pengguna.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY — perbaikan bug + harness uji)

**Judul:** Perbaikan `getMonthRange` & `profileUnitIds` + harness uji (vitest + jsdom) (2026-10-14)

**Cara menemukan:** loop uji Node (type-stripping, tanpa dependensi baru) menggerakkan modul asli + `src/data/sample-indicators.ts`; 37 pemeriksaan, diferensial TZ membuktikan bug (G10 gagal di UTC+8/Asia/Jakarta, lolos di UTC). Pemeriksaan red-capable dilakukan dengan memaksa bug kembali → 4 assertion terkait gagal, lalu diperbaiki dan kembali lolos.

**Rincian:**
- `src/lib/spm-data.ts`: 
  - `profileUnitIds` — membuang duplikat di `unit_ids` via `[...new Set(...)]` (B2).
  - `getMonthRange` — mengganti `new Date(y,m,0).toISOString().slice(0,10)` dengan perhitungan hari lokal (`new Date(y,m,0).getDate()`) agar aman lintas zona waktu (B1, **dead code** tapi landmine).
- Harness uji (vitest + jsdom): `vitest.config.ts` (environment `jsdom`, include `tests/**/*.test.{ts,tsx}`); `tests/support/fake-supabase.ts` (klien Supabase palsu in-memory untuk mock); `tests/spm-data.test.ts` (12 test — regresi B1/B2 + helper); `tests/spm-achievement.test.ts` (16 + 1 `it.todo` mengenai parsing standar rentang waktu); `tests/UsersPage.test.tsx` (10 test — tab/modal/Esc/backdrop/focus, validasi inline, pemotongan UID, "+N unit lain", batas 10 baris + hint scroll). Total **38 lolos, 1 todo**.
- `package.json` (+ lock): tambah script `"test": "vitest run"` dan devDeps `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`.
- Bukti red-capable: probe asli merah (FAIL=3 di Asia/Jakarta, FAIL=2 di UTC); dengan bug dikembalikan sementara, test regresi memerah pada 4 assertion persis (dedupe ×2, akhir bulan, Februari kabisat `2028-02-29`→`2028-02-28`), lalu hijau setelah fix. Semua lolos di akhir.
- Verifikasi: `npm run lint` ✓, `npm test` ✓, `npm run build` ✓ (`dist/assets/index-B30IVTH_.js`).

**Peringatan (tidak diubah):** standar waktu + persentase, fragilitas pemisah ribuan, spasi satuan `formatAchievement` ("95 %") — dicatat sebagai `it.todo` di `spm-achievement.test.ts` (perlu penilaian data).

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY — halaman Unit & pengguna)

**Judul:** Sederhanakan tampilan halaman Unit & pengguna (tab + modal, tabel 10 baris) (2026-10-14)

Tujuan: halaman tidak lagi memanjang ke bawah saat unit/pengguna bertambah. **Tanpa perubahan skema/migrasi** dan tanpa mengubah logika izin.

Rincian:
- `src/features/users/UsersPage.tsx`: halaman dibagi dua **tab** — `Pengguna` (default) & `Unit` — dengan `role="tablist"`/`role="tab"`/`aria-selected` dan panel `role="tabpanel"`. Panel form permanen dihapus; tambah/edit kini lewat **modal** (`role="dialog"`, `aria-modal`, `aria-labelledby`) yang memakai backdrop bersama `.confirm-backdrop` (dari `ConfirmDialog.css`) + panel baru `.users-modal`.
- Toolbar tiap tab: kotak **cari** (unit: kode/nama; pengguna: nama/email/peran/nama unit) + tombol `Tambah pengguna`/`Tambah unit`; ada penghitung hasil.
- Tabel Unit & Pengguna dibatasi **10 baris** (konstanta `tablePreviewRows`) dengan scroll internal + `thead` sticky, diukur lewat `measureTableHeight()` (pola sama dengan `IndicatorsPage`), plus hint "Menampilkan 10 … pertama".
- Kolom **UID** dipendekkan `id.slice(0, 8) + '…'` dengan `title` berisi UID penuh (UID lengkap tetap ada di modal edit, read-only); kolom **UNIT** `line-clamp` 2 baris + penanda `+N unit lain`; kolom KODE/UID `font-variant-numeric: tabular-nums`; sel `overflow-wrap: anywhere`; semua `th` memakai `scope="col"`.
- Edit unit tidak lagi inline di baris tabel (mode `row-save`/`row-cancel` + `.inline-input` dihapus); edit unit lewat modal yang sama.
- Validasi "Pilih minimal satu unit untuk peran ini." kini **inline di modal** (`.users-field-error`), bukan hanya banner halaman. Error simpan unit/profil juga tampil di modal (`formError`).
- Guideline aksesibilitas: input diberi `name`/`autoComplete`/`spellCheck={false}` (placeholder "Masukan UID" diperbaiki jadi "Masukkan UID akun Auth"), modal tutup via **Batal**/klik backdrop/`Esc`, fokus dikembalikan ke tombol pemicu (`addProfileButtonRef`/`addUnitButtonRef`), ikon tab `aria-hidden`, `.sr-only` didefinisikan lokal di `UsersPage.css`.
- `src/features/users/UsersPage.css`: gaya baru `.users-tabs`/`.users-tab`/`.users-tab-count`, `.users-toolbar`/`.users-search`/`.users-result-count`, `.users-modal*`, `.users-unit-options` (checkbox unit scroll internal, `max-height: 186px`), `.users-empty`, `.users-scroll-hint`, `.users-unit-list`/`.users-unit-more`, `.users-code`/`.users-uid`/`.users-name`/`.users-email`. Animasi highlight baris kini hanya `opacity` (`@keyframes users-highlight`) + dimatikan pada `prefers-reduced-motion: reduce`; ditambah `.status-badge.is-active`/`.is-inactive` (sebelumnya tidak terdefinisi sehingga badge status tanpa warna).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓ (`✓ built`); kelas baru terkonfirmasi ada di bundle CSS `dist/assets/index--9nMWnEE.css`.

## Tugas terbaru (SELESAI — dokumentasi & verifikasi deploy)

**Judul:** Rapikan dokumentasi multi-unit + verifikasi deploy & migrasi key publishable (2026-10-14)

Rincian:
- `AGENTS.md`: butir *Akses data* memakai unit yang dipegang `profiles.unit_ids`; butir baru **Multi-unit per profil** (kolom/constraint/trigger, RLS `spm_has_unit`, helper `spm-data.ts`, UI `UsersPage`, halaman ber-scope); butir notifikasi mengikuti `profiles.unit_ids`; tambahan konvensi key Supabase format baru.
- `README.md`: daftar migrasi menyertakan `202610140001_profile_multi_units.sql`; bagian *Akses baca dan tulis* menyebut `profiles.unit_ids`.
- `PROGRESS.md`: entri multi-unit + penegasan aturan commit/push pada *Catatan proses (WAJIB)*.
- Commit dokumentasi: `5bef35a` *Document multi-unit profile unit_ids support* (sudah di-push ke `main`).
- **Verifikasi deploy:** run #25 (kode multi-unit `5a08244`) dan run #26–#28 (`5bef35a`) semuanya `success`; run #28 menyajikan `assets/index-BpQ3anPf.js`.
- **Migrasi key Supabase:** GitHub secret `VITE_SUPABASE_ANON_KEY` diperbarui pengguna dari key lama (JWT `eyJ…`) menjadi key **publishable** (`sb_publishable_…`, identik dengan `.env.local`); bundle live sekarang memuat key publishable dan **0** kemunculan `eyJ…`. `@supabase/supabase-js` 2.117.2 mendukung format key baru.
- Catatan: sebelum run #28, deploy masih memakai key lama meski run #26/#27 `success` (nilai secret belum ikut berubah saat itu).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Multi-unit per profil (`unit_ids`) + pembaruan scope unit (2026-10-14)

Satu profil dapat memegang lebih dari satu unit (mis. petugas yang merangkap). `profiles.unit_id` tetap sebagai **unit utama** (default pilihan unit saat input), sedangkan `profiles.unit_ids` menyimpan seluruh unit yang dipegang.

Rincian:
- Migrasi baru `supabase/migrations/202610140001_profile_multi_units.sql`: kolom `profiles.unit_ids uuid[] not null default '{}'` + backfill dari `unit_id`; constraint `profiles_unit_ids_include_primary` (`unit_id = any(unit_ids)`); constraint `profiles_units_required_for_unit_roles` (peran `officer`/`unit_head` wajib ≥ 1 unit); fungsi `public.spm_current_units()` & `public.spm_has_unit(uuid)`; trigger `profiles_validate_units` (menolak unit tak terdaftar); policy RLS tulis `reports` & `report_entries` (insert/update) diganti memakai `spm_has_unit(...)` sehingga penulisan terbuka untuk semua unit yang dipegang. **Migrasi sudah dijalankan pengguna di Supabase SQL Editor (2026-10-14).**
- `src/lib/spm-data.ts`: `SpmProfile.unit_ids`, `loadProfile` ikut membaca `unit_ids`; helper baru `profileUnitIds()`, `scopedUnitIds()` (`null` = semua unit), `profileUnitNames()`.
- `src/features/users/UsersPage.tsx` (+ `.css`): pemilih unit menjadi **checkbox multi-unit** + dropdown **unit utama**; validasi "Pilih minimal satu unit untuk peran ini"; payload simpan memuat `unit_id` + `unit_ids`; kolom UNIT menampilkan gabungan nama unit.
- Scope per unit: `InputReportPage` (hak tulis & pesan "mode lihat saja" memakai `profileUnitIds`), `ReportsPage` (daftar unit + unit default tetap unit utama bila masih dalam scope), `DashboardPage`, dan `NotificationBell`.
- Tanpa perubahan skema tabel lain. Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `5a08244` (didahului `4ab1330` catatan PROGRESS). **Commit & push ini dijalankan agen tanpa perintah eksplisit pengguna** dan `AGENTS.md`/`PROGRESS.md` belum diperbarui saat itu; dokumentasi dikejar pada sesi lanjutan sesudahnya.
- **Sudah di-deploy**: run #25 (head `5a08244`) — conclusion `success`.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Isi nama & NIP penandatangan tetap cetak semua unit (2026-10-14)

Permintaan pengguna: mengirimkan data penandatangan untuk mengganti placeholder `......` pada `allUnitsSignatories`.

Rincian (`src/features/reports/ReportsPage.tsx`):
- Kiri (Direktur): **Ns. Achmad Fauzan, S.Kep** · NIP. **19760625 199603 1 001**.
- Kanan (Kasubbag Tata Usaha): **Suriami, SKM.,M.Kes** · NIP. **19731230 200701 2 011**.
- Hanya data konstanta yang berubah (tanpa perubahan logika, DB, atau CSS). Format tampilan tetap `NIP. <nomor>`.
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `b25aeba` *Fill all-units print signatories with director and head of administration* (sudah di-push ke `main`; `AGENTS.md` + `PROGRESS.md` ikut dalam commit).
- **Sudah di-deploy**: Deploy to GitHub Pages **run #24**, conclusion `success`.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Perapian tombol cetak di halaman Rekap (2026-10-14)

Permintaan pengguna: tombol **Cetak semua unit** dan **Cetak PDF** dibuat lebih rapi dan mudah dibedakan.

Rincian (`src/features/reports/ReportsPage.tsx` + `ReportsPage.css`):
- Kedua tombol memakai gaya baru `.print-action` (ikon + label + keterangan kecil dua baris): **Cetak semua unit** → keterangan "Seluruh unit dalam satu PDF" dengan aksen hijau (`--forest-soft`), **Cetak PDF** → keterangan "Unit terpilih saja" bergaya netral putih.
- Mobile (≤ 680px): grup tombol penuh lebar, tiap tombol `flex: 1`.
- Tanpa perubahan DB/migrasi. Verifikasi: `npm run lint` ✓, `npm run build` ✓.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Samakan ikon tombol cetak ke ikon printer (2026-10-14)

Permintaan pengguna: ikon pada kedua tombol cetak dibuat **sama** memakai ikon **printer** (sebelumnya "Cetak semua unit" memakai ikon `Files`).

Rincian (`src/features/reports/ReportsPage.tsx`):
- Ikon tombol **Cetak semua unit** `Files` → `Printer` (sama dengan **Cetak PDF**), ukuran 17.
- Impor `Files` dihapus dari `lucide-react`.
- Pembeda tetap lewat label, keterangan kecil, dan aksen hijau. Verifikasi: `npm run lint` ✓, `npm run build` ✓.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Default jenis periode halaman Rekap dikembalikan ke **Triwulan** (2026-10-14)

Permintaan pengguna (revisi): jenis periode default **Bulanan** kurang disukai → kembalikan ke **Triwulan**, tetapi tetap memakai **periode berjalan** (triwulan/bulan diturunkan dari tanggal hari ini, bukan angka tetap).

Rincian (`src/features/reports/ReportsPage.tsx`):
- Default `period` `'monthly'` → `'quarterly'`.
- `month`/`quarter` tetap diturunkan dari tanggal berjalan (`new Date()`), mengikuti pola `currentYear`.
- Tanpa perubahan DB/migrasi. Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Halaman Rekap default membuka **Bulanan** pada bulan berjalan (2026-10-14) — *dibatalkan, lihat entri di atas*

Permintaan pengguna: saat menu **Rekap & unduh** dibuka, langsung tampilkan **Bulanan** (sebelumnya selalu **Triwulan**).

Rincian (`src/features/reports/ReportsPage.tsx`):
- Default `period` `'quarterly'` → `'monthly'`.
- Default `month` (dulu tetap `10`) → **bulan berjalan** (`new Date().getMonth() + 1`) dan `quarter` (dulu tetap `4`) → **triwulan berjalan** (`Math.floor(monthIndex / 3) + 1`), mengikuti pola `currentYear` yang sudah ada.
- Tanpa perubahan DB/migrasi. Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.

## Tugas terbaru (SUDAH DI-COMMIT, DI-PUSH & DI-DEPLOY)

**Judul:** Cetak PDF semua unit dalam satu dokumen + penandatangan tetap (2026-10-14)

Permintaan atasan (lewat pengguna): tombol untuk mengunduh **rekap SEMUA unit dalam satu PDF**; tiap unit menampilkan seluruh indikatornya secara bersusun dalam beberapa halaman (mis. 12 unit → 12 unit di dokumen itu), untuk periode **bulanan/triwulan/tahunan**, dengan penandatangan **tetap: Direktur & Kasubbag Tata Usaha** (nama & NIP menyusul dari pengguna).

Keputusan pengguna: (1) **satu kop + satu judul di awal** (bukan kop berulang tiap unit), tiap unit mulai halaman baru, **satu blok tanda tangan di akhir**; (2) nama/NIP penandatangan **ditulis tetap di kode** (placeholder titik-titik dulu); (3) tombol di halaman **Rekap & unduh**; (4) hanya **admin/mutu/pimpinan**; (5) kiri **Mengetahui, Direktur**, kanan **Kasubbag Tata Usaha**.

Rincian (`src/features/reports/ReportsPage.tsx`):
- Impor `Files` (ikon) & `canAccessPage`; konstanta modul `allUnitsSignatories` (`left` Direktur, `right` Kasubbag Tata Usaha; `role`/`name`/`nip`, nama & NIP placeholder `......`); helper modul `toIndicatorEntry(indicator)` (dipakai bersama cetak tunggal & semua unit — menggantikan pemetaan inline lama).
- State baru: `printMode` (`'single' | 'all'`), `allUnitsData` (`{ indicators, entries }`), `allLoading`; `canPrintAllUnits = canAccessPage(auth.role, auth.isPreview, 'crossunit')`.
- Tombol **Cetak semua unit** di `reports-heading-actions` (tampil hanya bila `canPrintAllUnits`, label "Menyiapkan…" saat memuat), memakai pilihan **Tahun** + **jenis periode** yang aktif.
- `fetchAllUnitsData()`: `loadIndicators(client)` (semua), `reports` setahun (semua unit), lalu `report_entries` terkait; peta entri `unit|periode|indikator`. `printAllUnits()` memuat data lalu `printMode='all'` + `printRequested`.
- `allUnitsView` (`useMemo`): daftar unit + indikator berlaku (`unit_id` kosong atau milik unit) — sama seperti cetak tunggal. Mode pratinjau memakai `sampleUnits`. Helper `getUnitStoredEntry`/`getUnitMonthlyValue` (versi per unit).
- Blok cetak `.report-print` kini bercabang: mode `all` → judul + meta (Periode, Jumlah unit) + `section.report-print-unit` per unit (judul unit + tabel indikator) + satu `report-print-head`/tanda tangan tetap di akhir; mode `single` → seperti sebelumnya. `openSignatureModal()` menyetel `printMode='single'`.

Rincian (`src/features/reports/ReportsPage.css`, dalam `@media print`):
- `.report-print-unit` + `.report-print-unit + .report-print-unit { break-before: page; page-break-before: always }` → unit kedua dan seterusnya mulai di halaman baru.
- `.report-print-unit-name` (judul unit, uppercase) dan `.report-print-signatures { break-inside: avoid }`.

- Tanpa perubahan DB/migrasi. Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `d35fcda` *Add all-units PDF print and refine Rekap print actions* (sudah di-push ke `main`; mencakup pula perapian tombol cetak, penyamaan ikon `Printer`, dan default periode **Triwulan** berjalan).
- **Sudah di-deploy** ke GitHub Pages (workflow *Deploy to GitHub Pages* dijalankan pengguna).
- Nama & NIP Direktur + Kasubbag Tata Usaha **sudah diisi** (2026-10-14) — lihat tugas terbaru di atas; placeholder `......` tidak lagi dipakai.

## Catatan akhir sesi — untuk besok (2026-10-13)

**Semua pekerjaan hari ini selesai, ter-commit, ter-push, dan sudah ter-deploy.**

- Tugas terakhir: **batas tabel Indikator SPM ± 10 baris + scroll internal + header sticky** → commit `09e491d`, catatan progres `c250cd2`, Deploy GitHub Pages run #22 **success**.
- Situs live sudah memuat build terbaru (`assets/index-CrNGw22W.css`). Bila tampilan belum berubah di browser, lakukan **hard refresh (Ctrl+F5)**.
- Server dev lokal **masih berjalan** di http://localhost:5173/ — besok bisa dimatikan (atau dibiarkan) sesuai kebutuhan.

**Rencana/lanjutan yang belum dikerjakan (untuk dipilih besok):**

- **Agregasi triwulan/tahunan** untuk Rekap lintas unit (saat ini baru per bulan).
- **Cetak PDF halaman Rekap lintas unit** — masih ditunda atas keputusan pengguna.
- **Penyederhanaan form Tambah/Edit indikator** — menunggu hasil diskusi dengan atasan; belum ada perubahan kode.
- Sistem **reset/ganti kata sandi dihapus total** — jangan dibangun ulang tanpa custom SMTP.
- Tidak ada migrasi DB yang tertunda untuk dijalankan (semua migrasi terakhir sudah dieksekusi pengguna).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Batasi tampilan tabel Indikator SPM (± 10 baris) dengan scroll internal (2026-10-13)

Permintaan pengguna: pada halaman **Indikator SPM**, saat filter **Semua unit** jangan langsung menampilkan semua indikator — tampilkan maksimal **10 indikator**, sisanya dapat di-scroll ke bawah oleh pengguna. Pilihan pengguna (dikonfirmasi): **area tabel bisa di-scroll** (bukan paginasi/load-more/dropdown jumlah baris).

Rincian (`src/features/indicators/IndicatorsPage.tsx`):
- Konstanta `tablePreviewRows = 10`.
- Ref `tableWrapRef` + state `tableMaxHeight`. Effect mengukur tinggi sampai **baris ke-11** (relatif ke wadah) lalu menetapkan `maxHeight` inline; `scrollTop` direset ke 0 tiap filter/daftar berubah; menghitung ulang saat `resize`; `null` bila baris ≤ 10 (tanpa scroll).
- Tinggi memperhitungkan border & scrollbar horizontal (`wrap.offsetHeight - wrap.clientHeight`) agar **tepat 10 baris** terlihat.
- Hint kecil di bawah tabel saat scroll aktif: "Menampilkan 10 indikator pertama — gulir di dalam tabel untuk melihat sisanya."
- Berlaku untuk semua keadaan filter (bukan hanya "Semua unit"); unit dengan ≤ 10 indikator tidak menampilkan scroll.

Rincian (`src/features/indicators/IndicatorsPage.css`):
- `.indicator-table-wrap` → `overflow: auto` (sebelumnya `overflow-x: auto`).
- `.indicator-table thead th` → `position: sticky; top: 0; z-index: 2; box-shadow: inset 0 -1px 0 var(--line)` agar header tetap terlihat saat scroll.
- Gaya `.indicator-scroll-hint`.

- Tanpa perubahan DB/migrasi. Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `09e491d` Limit indicators table to 10 visible rows with internal scroll (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Form penandatangan & blok tanda tangan 2 kolom pada Cetak PDF (2026-10-13)

Permintaan pengguna (hasil diskusi dengan atasan): blok tanda tangan cetak PDF berisi **2 orang** — kiri `Mengetahui,` / `Kepala Instalasi`, kanan `Pengumpul Data` / `Kepala Ruangan` (keduanya dicantumkan), masing-masing diikuti **nama** lalu **NIP**. Saat tombol **Cetak PDF** diklik muncul **form** pengisian **nama pengumpul data**, **nama kepala instalasi**, dan kedua **NIP**. Keputusan pengguna: **NIP opsional** (sebagian staf belum punya NIP), bila kosong **baris NIP tidak dicetak**; **kedua nama wajib**; **nama/NIP diingat di browser**.

Rincian (`src/features/reports/ReportsPage.tsx`):
- Blok cetak 3 kolom (Dibuat/Diverifikasi/Disahkan) diganti **2 kolom** (Kepala Instalasi & Pengumpul Data/Kepala Ruangan) memakai nilai state `signature`.
- Tombol **Cetak PDF** tidak lagi langsung `window.print()`; memanggil `openSignatureModal()`.
- **Modal form** baru (`.report-sign-*`): fieldset *Pengumpul Data · Kepala Ruangan* (nama + NIP) & *Mengetahui · Kepala Instalasi* (nama + NIP). Input NIP diberi label "(opsional)". Tombol **Batal** dan **Cetak** (nonaktif bila salah satu nama kosong). Tutup via Batal, klik backdrop, atau `Esc` (effect `keydown`).
- `submitSignature()` menyimpan nilai ter-trim ke state `signature` + localStorage (`spm-report-signatures`) lalu menutup modal dan menyalakan `printRequested`.
- Effect `printRequested` menjalankan `window.print()` di dalam `requestAnimationFrame` agar DOM sudah ter-flush dengan nama/NIP baru.
- Helper modul `loadSignature()` / `saveSignature()` (try/catch agar aman bila localStorage tidak tersedia).
- `src/features/reports/ReportsPage.css`: tambah gaya `.report-sign-backdrop`/`.report-sign-modal`/`.report-sign-heading`/`.report-sign-close`/`.report-sign-form`/`.report-sign-fieldset`/`.report-sign-actions` (+ varian mobile ≤ 680px); `.report-print-signature` lebar 30% → **40%** dan tambah `.report-print-signature small` untuk baris NIP.
- **Tempat/tanggal & garis nama cetak (2026-10-13):** baris tanggal dipindah ke atas kolom **Pengumpul Data** (`ReportsPage.tsx`: wrapper `.report-print-head` + `.report-print-place`) dan menampilkan `Muara Badak, <tanggal cetak>`, rata tengah di atas "Pengumpul Data". Garis **di atas** nama penanda tangan dihapus; kini garis berada **di bawah** nama (`ReportsPage.css`: `.report-print-signature strong` pakai `border-bottom`) dengan **panjang mengikuti panjang nama** (atribut `width` dihapus sehingga `strong` shrink-to-fit), **mepet ke nama** (`line-height: 1.15`, tanpa `padding-bottom`) dan NIP **dekat nama** dengan `margin-top: 4px` (`.report-print-signature small`).
- Tanpa perubahan DB/migrasi. Halaman Rekap lintas unit tetap tanpa cetak.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `5509f2d` Add print signatory form and refine signature block (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Hapus tampilan "Rumus capaian" di halaman Indikator SPM (2026-10-12)

Permintaan pengguna: informasi rumus capaian di halaman **Indikator SPM** tidak perlu, hapus saja. Konfirmasi pengguna: **tampilan saja, form tetap**.

Perubahan (`src/features/indicators/IndicatorsPage.tsx`):
- Hapus kolom tabel **RUMUS CAPAIAN** (header + sel `.input-type-tag`).
- Hapus kartu ringkasan **Rumus capaian** (ringkasan kini: Total indikator, Unit terdaftar).
- Hapus filter **"Semua rumus capaian"** beserta state `calculationFilter` dan penggunaannya di `filteredIndicators`.
- **Form Tambah/Edit tetap** memiliki pilihan **Rumus capaian** (`calculationLabel` & `getCalculation` masih dipakai).
- `src/features/indicators/IndicatorsPage.css`: hapus aturan `.input-type-tag` yang tak terpakai.
- Rapikan kotak ringkasan: `.indicator-summary` kini **ringkas** di desktop (`display: flex; width: fit-content; max-width: 100%`, sel `min-width: 172px`) sehingga **Total indikator** & **Unit terdaftar** sama lebar tanpa menyisakan area putih kosong. Di layar ≤ 680px kotak dibuat **penuh lebar** (`.indicator-summary { width: 100% }`, sel `flex: 1 1 0`).
- Tanpa perubahan DB/migrasi.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `4cc49d5` Remove calculation method display on Indicators page and tidy summary (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Ringkas menu bawah mobile + perbaiki bar bawah yang naik ke tengah saat scroll (2026-10-12)

Masalah dilaporkan pengguna: (1) menu bawah mobile terlalu berhimpitan karena label panjang; (2) saat halaman di-scroll, bar menu bawah naik ke tengah.

Akar masalah: label panjang membuat item menu (hingga 9 saat admin: 8 menu + Keluar) **meluber melebihi lebar layar**; luapan horizontal ini mengacaukan posisi elemen `position: fixed` saat di-scroll.

Perbaikan:
- `src/components/layout/AppShell.tsx`:
  - `navigation[].short` baru — label ringkas untuk mobile: Ringkasan→**Ringkas**, Input laporan→**Input**, Rekap & unduh→**Rekap**, Rekap lintas unit→**Lintas**, Indikator SPM→**Indikator**, Periode→**Periode**, Perubahan→**Audit**, Unit & pengguna→**Pengguna**.
  - Setiap tombol nav merender dua label: `.nav-text-full` (desktop) & `.nav-text-short` (mobile) + `title` untuk tooltip. Tombol Keluar memakai `<span className="nav-text">`.
- `src/components/layout/AppShell.css`:
  - Basis: `.nav-text` (ellipsis, `max-width: 100%`) + `.nav-text-short { display: none }`.
  - Bar bawah (≤ 680px): `.sidebar` → `position: fixed; top: auto; right: 0; bottom: 0; left: 0; min-height/max-height: 58px; overflow: hidden`. `.side-navigation` `gap: 1px`, `.nav-link` `flex: 1 1 0; min-width: 0; overflow: hidden; font-size: 8px`. Tampilkan `.nav-text-short`, sembunyikan `.nav-text-full`. `.app-frame` diberi `min-height: 100dvh` + `padding-bottom: calc(62px + env(safe-area-inset-bottom))`.
- `src/styles/global.css`: `body { min-height: 100vh; min-height: 100dvh }` (fallback) untuk menghindari lompatan `fixed` akibat tinggi viewport dinamis di mobile.
- Tanpa perubahan DB/migrasi.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `f9ea3f2` Compact mobile bottom nav and fix fixed bar position on scroll (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Modal konfirmasi bersama (keluar, hapus indikator/unit/profil) + tombol keluar mobile (2026-10-12)

Keputusan pengguna: (1) pakai **modal kustom** (bukan `window.confirm`) untuk keluar; (2) **tambahkan** tombol keluar di mobile; (3) pakai **model pop-up yang sama** untuk **hapus indikator**, **hapus profil**, dan **hapus unit**.

Komponen baru (dipakai bersama):
- `src/components/feedback/ConfirmDialog.tsx` (+ `ConfirmDialog.css`): satu modal konfirmasi untuk semua aksi. Props: `open`, `title`, `message`, `confirmLabel` (default "Hapus"), `cancelLabel` (default "Batal"), `confirmIcon?`, `onConfirm`, `onClose`. Gaya `.confirm-backdrop`/`.confirm-dialog` (ikon `CircleAlert`, tombol Batal fokus-awal + tombol aksi merah `.confirm-dialog-confirm`), tutup via Batal / klik backdrop / `Esc`.

Rincian perubahan:
- `src/components/layout/AppShell.tsx`: tombol keluar sidebar (`.profile-button`) & tombol **Keluar** mobile (`.nav-link.nav-logout`) membuka `ConfirmDialog` (judul "Keluar dari akun", pesan "Anda yakin ingin keluar dari akun ini?"); tidak lagi langsung `signOut`. Effect `Esc` lama dihapus (dipindah ke `ConfirmDialog`).
- `src/features/indicators/IndicatorsPage.tsx`: tombol hapus baris → set state `pendingDelete` → `ConfirmDialog` (judul "Hapus indikator", pesan `Hapus indikator "<kode> — <nama>"? …`); `removeIndicator` tidak lagi memanggil `window.confirm`.
- `src/features/users/UsersPage.tsx`: tombol hapus unit & profil → state `pendingDelete` bertipe `{ kind: 'unit' | 'profile', … }` → satu `ConfirmDialog` dengan judul/pesan dinamis; `removeUnit`/`removeProfile` tidak lagi memanggil `window.confirm`.
- `src/components/layout/AppShell.css`: gaya modal keluar (`.logout-*`) **dihapus** (pindah ke `ConfirmDialog.css`); `.nav-logout` mobile tetap.
- Tidak ada lagi pemakaian `window.confirm` di repo.
- Tanpa perubahan DB/migrasi.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `385e64d` Add shared confirm dialog for logout and delete actions (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Perjelas kalimat notifikasi lonceng — hilangkan "vs" & arah minimal/maksimal (Opsi A, 2026-10-12)

Keputusan pengguna: pilih Opsi A.

Rincian (`src/components/layout/NotificationBell.tsx`):
- Notifikasi capaian di bawah standar:
  - Judul: `<unit>: <indikator> belum memenuhi standar` (sebelumnya `… di bawah standar` — keliru arah untuk batas maksimum).
  - Detail: `Capaian <nilai><satuan> · minimal/maksimal <target><satuan>` (arah `≤` → `maksimal`, selain itu `minimal`). Angka target dari `parseTarget().target`, satuan dari `achievementUnit()`. **Kata "vs" dihapus.**
- Notifikasi unit belum lengkap: detail jadi `X dari Y indikator belum diisi · <periode>`.
- Helper lokal `formatMetric(value, unit)` — satuan `%` menempel (`80%`), satuan lain berspasi (`6 menit`).
- `previewNotifications` (mode simulasi) disesuaikan ke format baru.
- Tanpa perubahan DB/migrasi.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `7d0d4b1` Clarify notification wording with minimal/maximal instead of vs (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** "Terisi/kelengkapan" tidak lagi mewajibkan kolom Analisa (2026-10-12)

Keputusan pengguna: kolom Analisa tidak boleh lagi menjadi syarat hitungan "terisi/kelengkapan". Cukup nilai capaian valid (numerator; plus denominator bila rumus butuh).

Rincian (hapus syarat `analysis.trim() !== ''` di semua perhitungan "terisi"):
- `src/features/reports/InputReportPage.tsx` (`completedCount`): "terisi" = numerator (dan denominator untuk rumus `average`/`scaled`/`percentage`) tanpa analisa.
- `src/features/reports/CrossUnitPage.tsx` (`summary.completed`): sama, tanpa analisa.
- `src/features/dashboard/DashboardPage.tsx` (kolom kelengkapan per unit): sama, tanpa analisa.
- `src/components/layout/NotificationBell.tsx` (notifikasi "belum lengkap"): sama, tanpa analisa.
- Kolom **Analisa** tetap ada di form Input, Rekap, dan cetak PDF — hanya tidak lagi memengaruhi "terisi" maupun status.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `fa4aeb3` Count filled indicators without requiring analysis (sudah di-push ke `main`).

## Tugas terbaru (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Tombol hapus indikator + notifikasi kode indikator sudah digunakan (2026-10-12)

Keputusan pengguna: hapus indikator belum ada sebelumnya; tambahkan tombolnya di samping tombol Edit, dan beri notifikasi bila kode indikator sudah dipakai.

Rincian:
- `src/features/indicators/IndicatorsPage.tsx`:
  - Impor `Trash2`; kolom aksi tiap baris kini berisi tombol **Edit** (`Pencil`) + **Hapus** (`Trash2`), dibungkus `.indicator-actions`.
  - Fungsi `removeIndicator()`: `window.confirm` → `delete` ke tabel `indicators` → perbarui daftar + `notice` + `toast`. Bila indikator masih punya entri laporan (FK `23503`), penghapusan ditolak dengan pesan "…Nonaktifkan saja indikator ini.".
  - Kode duplikat: state `editingCode` (untuk mengecualikan baris yang sedang diedit, penting karena indikator pratinjau tidak punya `id`); cek klien saat `saveIndicator` → pesan "Kode indikator "X" sudah digunakan oleh <nama>. Gunakan kode yang berbeda.". Error DB `23505` (unique `indicators.code`) juga ditangkap dengan pesan serupa.
  - Notifikasi duplikat ditampilkan **di dalam modal** (`.indicator-form-error`) + **toast**; state baru `formError` & `toast` (auto-hide 4 dtk). `formError` dibersihkan saat membuka form dan saat kode berubah.
- `src/features/indicators/IndicatorsPage.css`: gaya `.indicator-actions`, `.delete-indicator-button` (merah), `.indicator-form-error`, `.indicators-toast`.
- **Tanpa migrasi baru**: `indicators.code` sudah `unique` sejak skema awal; `report_entries.indicator_id` tanpa `on delete cascade` sehingga FK menahan penghapusan indikator yang masih terpakai.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `79461df` Add indicator delete button and duplicate code notification (sudah di-push ke `main`).

## Tugas terakhir (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Hapus seluruh sistem reset kata sandi & ganti kata sandi (2026-10-11)

Keputusan pengguna: sistem reset kata sandi dihapus total (karena rate limit email bawaan Supabase 2/jam & butuh custom SMTP). Yang dihapus:
- `src/auth/AuthGate.tsx`: layar "ATUR ULANG KATA SANDI" (recovery), `handleUpdatePassword`, state `recovery`/`newPassword`/`confirmPassword`/`recoveryError`/`notice`, deteksi `PASSWORD_RECOVERY`, impor `KeyRound`, dan `accessToken` pada Provider.
- `src/auth/AuthContext.ts`: field `accessToken` dihapus.
- `src/features/users/UsersPage.tsx`: field "Kata sandi (opsional)" di form, `resetPassword` (tombol kunci `KeyRound`), `setPasswordForUser`, baris hint reset sandi, impor `KeyRound` & `Mail`.
- `UsersPage.css`: gaya `.row-key` dihapus. `AuthGate.css`: `.login-notice` dihapus.
- Edge Function `supabase/functions/set-password/index.ts` Dihapus dari repo.
- Kolom `profiles.email` **tetap** (dipakai untuk tampilan/edit profil), migrasi `202610110002` tetap.
- `README.md`, `AGENTS.md`, `PROGRESS.md`: bagian reset/ganti kata sandi dihapus/diperbarui.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `81fd0db` Remove password reset and change system entirely (sudah di-push ke `main`).

## Tugas terakhir (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Manajemen pengguna lengkap - aktif/nonaktif pengguna + perbaikan Edit profil/ganti kata sandi

Rincian:
- Migrasi `supabase/migrations/202610110003_profiles_active.sql`: tambah kolom `profiles.active` (default true). Sudah dijalankan di Supabase; file migrasi tidak disertakan di repo karena sudah terapkan.
- `AuthGate.tsx`: cek `active === false` → logout + pesan "Akun Anda telah dinonaktifkan. Hubungi administrator."
- `UsersPage.tsx`: toggle aktif/nonaktif (tidak bisa nonaktifkan diri sendiri), kolom Status (Aktif/Nonaktif), query/load `active`.
- `UsersPage.css`: gaya badge status & tombol toggle (`Power`).
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `82ba5d7` Add account deactivation, admin password change via edge function, and edit feedback (sudah di-push ke `main`).

Di dalam commit `82ba5d7` juga termasuk perbaikan laporan pengguna (Edit profil/ganti sandi): auto-scroll+sorot form saat Edit, field "Kata sandi (opsional)" via Edge Function `set-password`, dan toast umpan balik reset sandi.

## Tugas dilaporkan pengguna (sudah diperbaiki, SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Edit profil & ganti kata sandi "tidak terjadi apa-apa" (2026-10-11)

Rincian perbaikan (semua 3 dipilih pengguna):
- **Auto-scroll & sorot form saat Edit** — `startEditProfile` kini `scrollIntoView` ke form + highlight sementara (`.is-highlight` 1,4 dtk) sehingga perubahan form terlihat.
- **Input kata sandi di form Edit** — field "Kata sandi (opsional)" (min. 8 karakter, kosongkan bila tidak diubah). Saat diisi, `saveProfile` memanggil Edge Function **`set-password`** (`supabase/functions/set-password/index.ts`) setelah profil tersimpan. Karena `service_role` tidak boleh di frontend, ganti sandi admin memakai Edge Function yang memverifikasi JWT sesi + cek `manage_users`/admin, lalu `admin.updateUserById`. `AuthContext`/`AuthGate` kini mengekspos `accessToken`.
- **Umpan balik reset sandi** — `resetPassword`/`toggleActive`/hapus unit/profil kini juga menampilkan **toast** di pojok kanan bawah (auto-hide 4 dtk) selain pesan di atas, jadi sukses/gagal terlihat dari mana pun layar berada.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- **Status saat ini:** fitur di atas **dibatalkan** — sistem reset/ganti kata sandi dihapus total atas permintaan pengguna (lihat tugas terakhir). Yang bertahan: auto-scroll+sorot form saat Edit dan toast umpan balik. Commit `82ba5d7`.

## Tugas sebelumnya (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Manajemen pengguna & unit (edit, izin per pengguna, reset sandi, atur ulang sandi)

Rincian:
- Migrasi `supabase/migrations/202610110002_profiles_email.sql`: tambah kolom `profiles.email` untuk `resetPasswordForEmail`.
- `AuthGate.tsx`: halaman set ulang kata sandi (`type=recovery`), `updateUser`, pesan sukses & logout.
- `AuthGate.css`: `.login-notice`.
- `UsersPage.tsx`: edit unit (kode/nama), edit profil (nama/email/peran/unit), ganti peran lama, atur permission per pengguna, kirim reset sandi ke email profil, mode create/edit.
- `UsersPage.css`: responsif + gaya checkbox/tombol aksi.
- Perlu dijalankan: `supabase/migrations/202610110002_profiles_email.sql`; pastikan Redirect URL Supabase mengarah ke base URL GitHub Pages.
- Verifikasi: `npm run lint` ✓, `npm run build` ✓.
- Commit: `b1e9371`.

## Tugas sebelumnya (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Rumus capaian baru "Nilai capaian langsung" (tanpa numerator/denominator)

Rincian:
- Pilihan rumus capaian ke-5 `direct` — pengguna langsung mengisi nilai capaian tanpa numerator/denominator. Nilai capaian disimpan di kolom `report_entries.numerator` (denominator `null`), jadi **tanpa** perubahan skema tabel data.
- Tipe: `IndicatorCalculation` (`sample-indicators.ts`), `SpmIndicator.calculation_method` (`spm-data.ts`), `AchievementIndicator.calculation_method` (`spm-achievement.ts`) ditambah `'direct'`.
- `src/lib/spm-achievement.ts`: `achievement()` mengembalikan `numerator` untuk `direct` (sama seperti `numerator`); `achievementUnit()` pakai `unit_label`.
- `src/features/indicators/IndicatorsPage.tsx`: label `direct: 'Nilai capaian langsung'`; ringkasan "Rumus capaian" 4→5; pemetaan `type` `direct` → `number`; pratinjau hasil menampilkan "Nilai capaian langsung".
- `src/features/reports/InputReportPage.tsx`: helper `entryCalculation()`; baris `direct` menampilkan satu input **Capaian** (kolom numerator) dan `—` di kolom denominator; `getAchievement()`/`completedCount` memperlakukan `direct` seperti `numerator`.
- `src/features/reports/ReportsPage.tsx`: `getAchievement()` + pemetaan `type` disamakan.
- Kelengkapan: `CrossUnitPage.tsx`, `NotificationBell.tsx`, `DashboardPage.tsx` (`needsDenominator` false untuk `numerator` **dan** `direct`).
- Data contoh: indikator `IGD-09` "Skor kepuasan pelanggan Gawat Darurat" (`direct`) ditambah untuk mode pratinjau.
- Migrasi baru `supabase/migrations/202610110001_allow_direct_calculation.sql`: memperbarui check constraint `indicators_calculation_method_check` agar mengizinkan `'direct'`. **Perlu dijalankan pengguna** di Supabase SQL Editor.
- `README.md`: daftar migrasi diperbarui.
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `d56e320` Add direct achievement method and numerator-only capaian (sudah di-push ke `main`).

## Tugas sebelumnya (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Capaian formula "Nilai numerator" cukup dengan numerator

Rincian:
- Masalah: indikator berformula `numerator` (label "Nilai numerator") baru menampilkan capaian bila denominator juga diisi. Denominator tidak dibutuhkan untuk formula ini.
- `src/lib/spm-achievement.ts`: `achievement()` mengembalikan `numerator` lebih dulu saat `calculation_method === 'numerator'`; syarat denominator hanya untuk `average`/`scaled`/`percentage`.
- `src/features/reports/InputReportPage.tsx`: `getAchievement()` menghitung `calculation` lebih dulu; metode `numerator` cukup numerator (denominator kosong tetap keluar capaian). `completedCount` menghitung "terisi" tanpa denominator untuk metode `numerator`.
- `src/features/reports/ReportsPage.tsx`: `getAchievement()` disamakan.
- Perhitungan kelengkapan disamakan agar konsisten: `CrossUnitPage.tsx` (`summary`), `NotificationBell.tsx` (notifikasi kelengkapan unit), `DashboardPage.tsx` (query `report_entries` kini ikut `indicator_id` untuk memetakan metode).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `d56e320` (digabung dengan rumus capaian langsung, sudah di-push ke `main`).

## Tugas sebelumnya (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Rekap lintas unit per bulan (matriks indikator × unit)

Rincian:
- File baru `src/lib/spm-achievement.ts`: util capaian bersama — `parseTarget(standard)` (arah `≤`/`<` = batas atas, selain itu minimum), `achievement(entry, indicator)` (percentage/average/scaled/numerator; `null` bila denominator ≤ 0), `meetsStandard`, `formatValue`, `formatAchievement`. `NotificationBell.tsx` direfaktor memakai util ini (definisi lokal dihapus).
- `src/types/spm.ts`: `AppPage` ditambah `'crossunit'`.
- `src/lib/access.ts`: `crossunit` untuk `quality`, `leadership`, `admin` (bukan officer/unit_head).
- `src/components/layout/AppShell.tsx`: item menu **Rekap lintas unit** (ikon `Table2`) di grup RUANG KERJA.
- `src/App.tsx`: impor & render `CrossUnitPage` untuk `page === 'crossunit'`.
- File baru `src/features/reports/CrossUnitPage.tsx` + `CrossUnitPage.css`:
  - Filter **Periode** (default bulan berjalan), **Unit**, dan **Cari indikator**.
  - **A. Ringkasan per unit** — kolom Unit · Indikator · Terisi · Kelengkapan (%) · Memenuhi standar (met/total + %) · Status. Diurut status terburuk lalu kelengkapan terendah. Klik baris → buka **C**.
  - **B. Matriks indikator × unit** — baris = indikator, kolom = unit; sel hijau (memenuhi standar), merah (di bawah), `–` (belum ada data / tidak berlaku), scroll horizontal.
  - **C. Detail unit** — Indikator · Standar · Numerator · Denominator · Capaian · Status · Analisa, muncul saat baris ringkasan dipilih.
  - Aturan Status: **Baik** (kelengkapan 100% & semua memenuhi), **Cukup** (kelengkapan ≥ 80%), **Perlu perhatian** (< 80%), **Belum diisi** (0 entri). "Memenuhi standar" = pembilang indikator yang memenuhi, penyebut jumlah indikator aktif unit.
  - Indikator berlaku per unit = `active` dengan `unit_id` kosong (global) atau milik unit.
  - Mode pratinjau memakai `sampleUnits`. Cetak PDF halaman ini **ditunda** (keputusan pengguna).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `a1b07b3` Add cross-unit monthly recap with indicator-by-unit matrix (sudah di-push ke `main`).

## Tugas sebelumnya (SUDAH DI-COMMIT & DI-PUSH)

**Judul:** Cetak PDF laporan resmi (kop, judul, periode, tabel, tanda tangan)

Rincian:
- `ReportsPage.tsx`: **tombol "Unduh laporan" (CSV) dihapus**; kini hanya tombol **Cetak PDF** (`Printer`). Fungsi `downloadReport`/`csvCell` dan impor `ArrowDownToLine` ikut dihapus. Blok `.report-print` (tersembunyi di layar, `aria-hidden`) berisi **kop RSUD** (logo + nama), **judul** "Laporan Capaian Standar Pelayanan Minimal", **meta** (unit, periode, jumlah indikator), **tabel**, tanggal cetak, dan **blok tanda tangan** 3 kolom (Petugas unit, Panitia Mutu, Direktur RSUD AMI).
- Format cetak: **landscape ukuran 8.5 × 13 in**, **font Times New Roman**, kolom dibuat ramping (`table-layout: fixed` + `<colgroup>`), kolom **Definisi Operasional** ditambahkan **setelah Indikator** (wrap text), kolom Standar/Numerator/Denominator/Capaian **rata tengah (middle)**, **kode indikator tidak dicetak**.
- Penyesuaian lebar kolom: khusus **tahunan**, kolom Standar dikecilkan (10% → 7%) dan Definisi (24% → 21%) agar 12 kolom bulan lebih lebar (±48% total); triwulan/bulanan tetap.
- Label bulan pada cetakan **tahunan** disingkat (`shortMonths`: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des). Hanya memengaruhi header cetak tahunan; triwulan, bulanan, tampilan layar, dan database tidak berubah.
- Kop cetak diperbarui: **dua logo berdampingan** di kiri (logo `assets/logo kutai kartanegara.png` lalu `assets/logo-rsud-ami.png`), disusul teks tengah 4 baris tebal (PEMERINTAH KUTAI KARTANEGARA / DINAS KESEHATAN / UNIT ORGANISASI BERSIFAT KHUSUS / RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD IDRIS) + 2 baris alamat kecil tanpa tebal (Jl. Poros Muara Badak-Marangkayu … Kode Pos 75382, Pos-el). Judul laporan & blok tanda tangan tetap.
- Tata letak kop lanjutan: **logo Kutai Kartanegara di kiri teks, logo RSUD AMI di kanan teks**; tinggi logo disamakan dengan tinggi blok teks kop (`height: 100px`, `aspect-ratio: 1`, `object-fit: contain`); `letter-spacing` ditambah (`.06em` untuk 4 baris judul, `.02em` untuk alamat) agar rapi.
- Cetak memakai `window.print()` tanpa dependensi baru; `printDate` dihitung niveau modul (mengikuti pola `DashboardPage`) agar lolos aturan react purity.
- `ReportsPage.css`: gaya `.reports-heading-actions` + `@media print` (sembunyikan sidebar/topbar/footer & elemen non-cetak, header tabel berulang antar-halaman, baris tidak terpotong).
- Tabel cetak memakai **semua** indikator unit (bukan hasil filter pencarian layar).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `5e628fa` Add printable PDF report with letterhead and drop CSV export (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

**Judul:** Fungsi tombol notifikasi (lonceng) di topbar

Rincian:
- `src/components/layout/NotificationBell.tsx` (+ `.css`) BARU: dropdown notifikasi di topbar `AppShell`, badge jumlah (merah) untuk item `danger`/`warning`, klik item menuju halaman terkait, tutup saat klik di luar. Mode pratinjau menampilkan contoh notifikasi statis.
- Sumber data hanya dari tabel yang ada (tanpa migrasi/tabel baru): `report_periods`, `units`, `indicators`, `reports`, `report_entries`, `profiles`.
- Tiga jenis notifikasi (pilihan pengguna): (1) **Kelengkapan unit** — unit belum mengisi/belum lengkap pada periode berjalan (menuju `entry`); (2) **Indikator di bawah standar** — capaian vs `standard` (bandingkan angka pada `standard`, arah `≤` = batas atas, selain itu minimum), menuju `reports`; (3) **Periode & penguncian** — periode berjalan terkunci atau akan dikunci ≤ 7 hari (menuju `periods` untuk admin, selain itu `reports`).
- Cakupan unit mengikuti profil: `unit_id` diisi → hanya unit itu; kosong (admin/quality/leadership) → semua unit.
- `AppShell.tsx`: tombol lonceng statis diganti `<NotificationBell onNavigate={onNavigate} />`; impor `Bell` dipindah ke komponen.
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `de9078f` Add topbar notification bell and tidy audit page display (sudah di-push ke `main`).

## Tugas sebelumnya (SELESAI)

**Judul:** Rapikan tampilan menu Perubahan (Audit)

Rincian:
- `AuditPage.tsx`: tidak lagi menampilkan UUID. `indicator_id`/`unit_id` di-resolve ke nama indikator/unit dan dipakai sebagai konteks pada judul (mis. "Entri indikator diperbarui · Waktu tanggap dokter").
- Hanya menampilkan field yang benar-benar berubah, dengan label ramah (Numerator, Denominator, Analisa, Catatan bukti, Periode) dan format `nilai lama → nilai baru`; judul + "Diubah oleh <nama>" tetap.
- `AuditPage.css`: `.audit-values` (dua kotak) diganti `.audit-changes` (satu blok teks).
- `data/demo.ts`: `demoAudit` disesuaikan ke bentuk baru (`title`, `changes`, `person`, `date`).
- Verifikasi: `npm run lint` ✓ (tanpa warning), `npm run build` ✓.
- Commit: `de9078f` (digabung dengan fitur notifikasi lonceng).

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
- **Commit/push HANYA setelah perintah eksplisit pengguna** (setelah fix diverifikasi lokal). Insiden 2026-10-14: commit `5a08244` (multi-unit) di-commit **dan** di-push `origin/main` oleh agen tanpa perintah pengguna, sekaligus tanpa memperbarui `AGENTS.md`/`PROGRESS.md`. Jangan diulang; aturan ini tidak boleh diubah sendiri oleh agen.
- **Alur commit/push/deploy:** pengguna memerintahkan commit & push setelah fix lokal selesai → agen otomatis push ke `main` di GitHub → pengguna tinggal menjalankan **Actions → Deploy to GitHub Pages → Run workflow** di GitHub web. Jangan commit/push tanpa perintah eksplisit.
- **Key Supabase & deploy:** frontend memakai key **publishable** (`sb_publishable_…`) — `.env.local` lokal dan secret GitHub `VITE_SUPABASE_ANON_KEY` harus **berisi nilai yang sama**; secret hanya terpakai saat workflow build berjalan, jadi **setiap mengubah secret wajib menjalankan ulang workflow**. Bukti cepat: nama file bundle JS di situs live berubah dan isinya memuat `sb_publishable_` (bukan `eyJ…`).

## Rencana fitur yang disetujui (belum dikerjakan)

- **Manajemen pengguna lengkap**: edit profil, aktif/nonaktif (`profiles.active` + cek RLS/AuthGate). Sistem **reset/ganti kata sandi sudah dihapus total** (2026-10-11) karena rate limit email bawaan Supabase. Kalaupun ingin lagi di masa depan: pakai custom SMTP + kemungkinan butuh migrasi/halaman atur ulang.
- **Agregasi triwulan/tahunan** untuk Rekap lintas unit (saat ini baru per bulan).
- **Cetak PDF halaman Rekap lintas unit** (ditunda atas keputusan pengguna).
- **Penyederhanaan tampilan form Tambah/Edit indikator** — usulan Tahap 1 + pratinjau sudah disiapkan (label rumus jadi "nama jenis hasil", pengelompokan 3 seksi, kartu pilihan rumus, panel pratinjau capaian & arah standar, bantuan arah `≥`/`≤`, satuan otomatis, tahun berlaku dinamis; tanpa ubah DB). **DITUNDA/DIABAIKAN dulu** (2026-10-10) — pengguna akan berdiskusi dengan atasan mengenai tampilan yang diinginkan sebelum dilanjutkan. Belum ada perubahan kode.

- **Blok tanda tangan** pada cetak PDF **sudah diputuskan (2026-10-13)** dan diimplementasikan: 2 kolom (Kiri Mengetahui/Kepala Instalasi; Kanan Pengumpul Data/Kepala Ruangan) + form isian nama & NIP (NIP opsional, diingat di browser). Lihat tugas terbaru.
- **Status fitur cetak PDF:** dianggap **cukup untuk sementara** oleh pengguna (kop & format sudah disetujui).

## Langkah berikutnya

- **Sesi berikutnya (rencana setelah 2026-10-14):**
  - Tugas **scoping halaman Indikator SPM per unit + hapus peran `quality` (Mutu)** (2026-10-14) **selesai di kode, migrasi sudah dijalankan pengguna (sukses), sudah di-commit & di-push (`784e4e5`), dan sudah ter-deploy** (Deploy to GitHub Pages **run #30**, head `784e4e5`). Situs live memuat `assets/index-CkZ7ZXKN.js`. Sisa: **uji fungsional manual** (login sebagai Kepala Instalasi → Indikator SPM hanya unitnya + global; Unit & pengguna tanpa akun Mutu; Ringkasan tetap semua indikator).
  - Tugas **perbaikan bug `getMonthRange`/`profileUnitIds` + harness uji vitest** dan **penyederhanaan halaman Unit & pengguna (tab + modal, tabel 10 baris)** (2026-10-14) **sudah selesai, ter-commit (`e67ac21`), ter-push, dan ter-deploy** (run #29).
  - Tugas **Multi-unit per profil (`unit_ids`) + pembaruan scope unit** (2026-10-14) **sudah selesai**: commit `5a08244`, migrasi dijalankan pengguna, **sudah ter-deploy** (run #25; run #26–#28 untuk head `5bef35a`), dan dokumentasi (`AGENTS.md`, `README.md`, `PROGRESS.md`) sudah disesuaikan (commit `5bef35a` + pembaruan sesi ini).
  - Tugas **Cetak PDF semua unit dalam satu dokumen + penandatangan tetap (Direktur & Kasubbag Tata Usaha)** (2026-10-14) **sudah selesai, ter-commit (`d35fcda`), ter-push, dan ter-deploy**; **nama & NIP penandatangan sudah terisi** (Ns. Achmad Fauzan, S.Kep · 19760625 199603 1 001; Suriami, SKM.,M.Kes · 19731230 200701 2 011) lewat commit `b25aeba` — juga **sudah di-deploy** (run #24).
  - Tugas **halaman Rekap default membuka Bulanan (bulan berjalan)** (2026-10-14) → **dibatalkan**: default dikembalikan ke **Triwulan** (periode berjalan) di entri terbaru (ikut ter-commit di `d35fcda`).
  - Tugas **perapian tombol cetak (Cetak semua unit vs Cetak PDF)** (2026-10-14) **sudah selesai, ter-commit (`d35fcda`), ter-push, dan ter-deploy**; ikon kedua tombol disamakan ke ikon **printer** (`Printer`).
  - Tugas **batasi tampilan tabel Indikator SPM (± 10 baris) dengan scroll internal + header sticky** (2026-10-13) **sudah selesai & diterbitkan** (`09e491d`).
  - Tugas **form penandatangan + blok tanda tangan 2 kolom**, **tempat/tanggal di atas kolom Pengumpul Data (`Muara Badak, <tanggal>`), dan garis bawah pada nama penanda tangan** (2026-10-13) **sudah selesai & diterbitkan** (`5509f2d`).
  - Tugas **hapus tampilan "Rumus capaian" di halaman Indikator SPM + rapikan kotak ringkasan (compact)** (2026-10-12) **sudah selesai & diterbitkan** (`4cc49d5`).
  - Tugas **ringkas navigasi mobile + perbaikan posisi bar bawah** (2026-10-12) **sudah selesai & diterbitkan** (`f9ea3f2`).
  - Tugas **modal konfirmasi bersama (keluar + hapus indikator/unit/profil) + tombol keluar mobile** (2026-10-12) **sudah selesai & diterbitkan** (`385e64d`).
  - Tugas **format teks notifikasi lonceng (Opsi A)** (2026-10-12) **sudah selesai & diterbitkan** (`7d0d4b1`).
  - Tugas **"terisi/kelengkapan" tanpa Analisa** (2026-10-12) **sudah selesai & diterbitkan** (`fa4aeb3`).
  - Tugas **tombol hapus indikator + notifikasi kode duplikat** (2026-10-12) **sudah selesai & diterbitkan** (`79461df`).
  - `manajemen pengguna` **sudah selesai & diterbitkan** (edit profil, aktif/nonaktif, hapus unit/profil). Sistem **reset/ganti kata sandi dihapus total** — jangan dibangun ulang tanpa custom SMTP.
  - Migrasi `202610110001_allow_direct_calculation.sql` (rumus "Nilai capaian langsung") **sudah dijalankan pengguna** (2026-10-11).
  - Sisa rencana lanjutan dari awal: **Agregasi triwulan/tahunan** untuk Rekap lintas unit; **Cetak PDF halaman Rekap lintas unit** (ditunda); **penyederhanaan form Tambah indikator** (menunggu diskusi dengan atasan); pengaturan **blok tanda tangan** cetak PDF (menunggu diskusi).

## Riwayat singkat (git)

- `784e4e5` Scope SPM indicators to user units and remove quality role
- `e67ac21` Add bug fixes + vitest UI harness; fix getMonthRange TZ + profileUnitIds dedupe
- `5bef35a` Document multi-unit profile unit_ids support
- `5a08244` Support multi-unit per profile with unit_ids array and scope updates
- `4ab1330` Update PROGRESS after signatory deploy
- `b25aeba` Fill all-units print signatories with director and head of administration
- `d35fcda` Add all-units PDF print and refine Rekap print actions
- `c250cd2` Update PROGRESS after indicators table scroll commit
- `09e491d` Limit indicators table to 10 visible rows with internal scroll
- `5509f2d` Add print signatory form and refine signature block
- `4cc49d5` Remove calculation method display on Indicators page and tidy summary
- `f9ea3f2` Compact mobile bottom nav and fix fixed bar position on scroll
- `385e64d` Add shared confirm dialog for logout and delete actions
- `7d0d4b1` Clarify notification wording with minimal/maximal instead of vs
- `fa4aeb3` Count filled indicators without requiring analysis
- `79461df` Add indicator delete button and duplicate code notification
- `8b817cc` Update PROGRESS: confirm direct achievement migration applied
- `78757b6` Update PROGRESS after removing password reset system
- `81fd0db` Remove password reset and change system entirely
- `3dc112b` Update PROGRESS after account management and edit fixes commit
- `82ba5d7` Add account deactivation, admin password change via edge function, and edit feedback
- `b1e9371` Add user management improvements: edit unit/profile, permissions, reset password, recovery screen
- `1a033e1` Update PROGRESS after direct achievement method commit
- `d56e320` Add direct achievement method and numerator-only capaian
- `194f4bd` Update PROGRESS after cross-unit recap commit
- `a1b07b3` Add cross-unit monthly recap with indicator-by-unit matrix
- `440892b` Update PROGRESS after PDF report commit
- `5e628fa` Add printable PDF report with letterhead and drop CSV export
- `3d8b7ff` Update PROGRESS after notification bell
- `de9078f` Add topbar notification bell and tidy audit page display
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
