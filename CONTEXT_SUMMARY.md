# Context Summary — Kasir Front House

**Repo:** https://github.com/ghanz-stack/KASIR-FH-BISMILLAH
**File utama:** `www/index.html` (single-file HTML/JS PWA, dibungkus jadi APK Android via Capacitor 6)
**Package/appId:** `id.co.usahabersamanatar.kasirfronthouse`
**Key localStorage:** `kasirAppDataV1`

Aplikasi kasir/POS buat bisnis PPOB & gadget front-house, ngatur banyak akun (Saveplus, Mandiri, DANA, Cash, Barang, Voucher Fisik, dll) dengan sistem double-entry (Pemasukan/Pengeluaran/Netral/Mutasi) + rekonsiliasi Tutup Kasir.

---

## Bug Sudah Di-fix (urut kronologis)

1. **`getSaldoAsOf()` salah pilih closing** — dulu selalu ambil closing TERBARU keseluruhan (`getLatestClosing`), bukan closing terakhir **sebelum tanggal yang diminta**. Bikin Laporan Laba Rugi bulan lalu & Tutup Kasir susulan salah kalau ada closing yang lebih baru. Di-extract jadi helper `getClosingAsOf(accountId, tanggal)`, dipakai ulang di 3 tempat (getSaldoAsOf, cashContributionFromAccountHTML, cashOriginBreakdownHTML).

2. **`screenTutupKasirSeluruh` crash** — typo variabel `totalSaldo` (harusnya `totalSistem`), bikin ReferenceError, layar gagal render total (kelihatan kayak "gak bisa diklik").

3. **`TOTAL SALDO SISTEM` di Tutup Kasir Seluruh ikut ngitung Cash** — padahal baris di atasnya cuma nampilin akun non-cash & Cash ditampilin terpisah sebagai "PEMBANDING". Sekarang `eligible`/`totalSistem` dihitung dari `nonCashAccs` doang, biar sinkron sama dashboard.

4. **Fitur Restore dari Backup JSON belum ada** — cuma ada `backupJson()` (download), gak ada cara restore. Ditambahin `restoreJson()` (dari file) + `restoreJsonFromText()` (dari paste teks) + `normalizeDB()` (di-extract dari `loadDB()`, dipanggil ulang pas restore biar migrasi tetap jalan).

5. **Backup gak nyimpen file di APK** — root cause: Android WebView (Capacitor) gak punya download manager buat `<a download>` blob URL kayak browser. `downloadFile()` sekarang deteksi `Capacitor.isNativePlatform()`, pakai `Filesystem.writeFile()` + `Share.share()` di native, fallback ke blob-download di browser. **Butuh plugin `@capacitor/filesystem` + `@capacitor/share`** (sudah ditambah ke `package.json`, tapi tetap butuh `npm install` + `npx cap sync android` + rebuild manual).

6. **Backup ke Clipboard** (fitur baru, lebih simpel) — `backupClipboard()` pakai `navigator.clipboard`/`document.execCommand('copy')`, gak butuh plugin native. Pasangannya `restoreJsonFromText()`.

7. **Audit nominal janggal kelewat sensitif** — dulu >3x rata-rata dari 5 sampel (rata-rata gampang keskew, transaksi besar legit sering ke-flag). Diganti median + ambang >5x + minimal 8 sampel.

8. **Kasbon cuma bisa buat Pemasukan** — dibuka juga buat Pengeluaran (hutang ke vendor), ditambah field `arah` (`piutang`/`hutang`) di record kasbon, total ditampilin di layar Kasbon.

9. **BUG: arah kasbon salah** — sempat nentuin hutang/piutang dari `flow` doang. PPOB (Paket Data dll) flow-nya Pengeluaran tapi tetap JUALAN → harusnya piutang. Fix: `arah = 'hutang'` HANYA kalau `flow==='Pengeluaran' && !is_penjualan`.

10. **BUG: hapus riwayat pelunasan kasbon gak balikin status** — ditambah field `kasbon_ref_id` di tx pelunasan buat link balik ke record kasbon. `deleteTx()` sekarang otomatis revert status ke `unpaid` + `tanggal_lunas=null` kalau tx pelunasan-nya dihapus.

## ⚠️ Masalah Besar yang Belum Selesai — Keystore APK

**Root cause kenapa data user hilang tiap update APK:** workflow GitHub Actions build `assembleDebug` di runner ephemeral TANPA `signingConfig` tetap → tiap build generate debug keystore RANDOM baru → tiap update APK signature-nya beda → Android maksa uninstall dulu → semua `localStorage` kehapus.

**Fix yang sudah disiapkan:** `debug.keystore` tetap + `android/app/build.gradle` dengan `signingConfigs.debug` yang nunjuk ke file itu — **sudah di-push ke repo**. Tapi:
- Update APK **pertama** setelah fix ini TETAP bakal minta uninstall (signature lama random, gak bisa direkonstruksi) — itu **terakhir kalinya**.
- User harus rescue data yang sekarang ada di HP dulu (via `chrome://inspect#devices` — panduan lengkap ada di file `rescue-data-chrome-inspect.md` yang udah dikasih ke Will) SEBELUM update APK itu.
- Setelah itu, restore pakai fitur "Restore dari Teks" yang udah dibikin.
- Mulai dari situ, semua update berikutnya beneran "update" (data otomatis aman).

## Status Push ke GitHub

Semua fix di atas (kecuali kalau disebutkan beda) sudah live di branch `main`. History commit terakhir kurang lebih:
- fix: getSaldoAsOf, Tutup Kasir Seluruh, Restore JSON
- fix: backup native + package.json + keystore tetap
- fix: kasbon hutang/piutang + audit median + backup clipboard
- fix: merge semua fix di atas ke UI baru (redesign SVG icon)
- fix: arah kasbon pakai is_penjualan (bukan flow) + revert status kasbon pas hapus pelunasan

## Yang Perlu Will Lakuin Manual (bukan bisa di-otomatisasi dari sini)
1. `npm install @capacitor/filesystem @capacitor/share` di lokal, lalu `npx cap sync android`
2. Rescue data user existing via chrome://inspect SEBELUM install APK baru
3. Install APK baru (sekali ini minta uninstall — expected)
4. Restore data via fitur "Restore dari Teks"
5. Revoke Personal Access Token GitHub setelah semua revisi kelar
