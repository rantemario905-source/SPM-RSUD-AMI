# PROGRESS.md — Status Pekerjaan

Catatan progres agar pekerjaan dapat dilanjutkan antar sesi. Perbarui file ini setiap selesai tugas.

## Status saat ini

- **Tanggal update terakhir:** 2026-10-12
- **Kondisi working tree:** bersih. HEAD `f9ea3f2` (sudah di-push ke `main`).
- **Verifikasi sesi ini:** `npm run lint` ✓, `npm run build` ✓.

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
- **Alur commit/push/deploy:** pengguna memerintahkan commit & push setelah fix lokal selesai → agen otomatis push ke `main` di GitHub → pengguna tinggal menjalankan **Actions → Deploy to GitHub Pages → Run workflow** di GitHub web. Jangan commit/push tanpa perintah eksplisit.

## Rencana fitur yang disetujui (belum dikerjakan)

- **Manajemen pengguna lengkap**: edit profil, aktif/nonaktif (`profiles.active` + cek RLS/AuthGate). Sistem **reset/ganti kata sandi sudah dihapus total** (2026-10-11) karena rate limit email bawaan Supabase. Kalaupun ingin lagi di masa depan: pakai custom SMTP + kemungkinan butuh migrasi/halaman atur ulang.
- **Agregasi triwulan/tahunan** untuk Rekap lintas unit (saat ini baru per bulan).
- **Cetak PDF halaman Rekap lintas unit** (ditunda atas keputusan pengguna).
- **Penyederhanaan tampilan form Tambah/Edit indikator** — usulan Tahap 1 + pratinjau sudah disiapkan (label rumus jadi "nama jenis hasil", pengelompokan 3 seksi, kartu pilihan rumus, panel pratinjau capaian & arah standar, bantuan arah `≥`/`≤`, satuan otomatis, tahun berlaku dinamis; tanpa ubah DB). **DITUNDA/DIABAIKAN dulu** (2026-10-10) — pengguna akan berdiskusi dengan atasan mengenai tampilan yang diinginkan sebelum dilanjutkan. Belum ada perubahan kode.

- **Blok tanda tangan** pada cetak PDF sementara dibiarkan apa adanya (Dibuat oleh / Diverifikasi oleh / Disahkan oleh) — **pengaturan penandatangan menunggu diskusi pengguna dengan atasan**.
- **Status fitur cetak PDF:** dianggap **cukup untuk sementara** oleh pengguna (kop & format sudah disetujui).

## Langkah berikutnya

- **Sesi berikutnya (rencana setelah 2026-10-12):**
  - Tugas **ringkas navigasi mobile + perbaikan posisi bar bawah** (2026-10-12) **sudah selesai & diterbitkan** (`f9ea3f2`).
  - Tugas **modal konfirmasi bersama (keluar + hapus indikator/unit/profil) + tombol keluar mobile** (2026-10-12) **sudah selesai & diterbitkan** (`385e64d`).
  - Tugas **format teks notifikasi lonceng (Opsi A)** (2026-10-12) **sudah selesai & diterbitkan** (`7d0d4b1`).
  - Tugas **"terisi/kelengkapan" tanpa Analisa** (2026-10-12) **sudah selesai & diterbitkan** (`fa4aeb3`).
  - Tugas **tombol hapus indikator + notifikasi kode duplikat** (2026-10-12) **sudah selesai & diterbitkan** (`79461df`).
  - `manajemen pengguna` **sudah selesai & diterbitkan** (edit profil, aktif/nonaktif, hapus unit/profil). Sistem **reset/ganti kata sandi dihapus total** — jangan dibangun ulang tanpa custom SMTP.
  - Migrasi `202610110001_allow_direct_calculation.sql` (rumus "Nilai capaian langsung") **sudah dijalankan pengguna** (2026-10-11).
  - Sisa rencana lanjutan dari awal: **Agregasi triwulan/tahunan** untuk Rekap lintas unit; **Cetak PDF halaman Rekap lintas unit** (ditunda); **penyederhanaan form Tambah indikator** (menunggu diskusi dengan atasan); pengaturan **blok tanda tangan** cetak PDF (menunggu diskusi).

## Riwayat singkat (git)

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
