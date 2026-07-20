# Kasir Front House — Android App

Single-file HTML/CSS/JS (`www/index.html`) dibungkus jadi APK Android via
Capacitor. Build APK dilakukan otomatis oleh GitHub Actions
(`.github/workflows/build-apk.yml`) setiap push ke `main`/`master`, atau
manual lewat tab **Actions → Build Android APK → Run workflow**.

## Cara pakai
1. Push repo ini ke GitHub.
2. Buka tab **Actions**, tunggu workflow selesai (~3-5 menit).
3. Download APK dari **Artifacts** di halaman run tersebut
   (`kasir-fronthouse-debug-apk`).
4. Install di HP Android (aktifkan "Install dari sumber tidak dikenal").

APK yang dihasilkan adalah **debug build** (langsung installable, tanpa
signing key). Kalau nanti butuh release build buat Play Store, tinggal
tambah signing config di `android/app/build.gradle` — belum dibuat karena
belum diminta (YAGNI).

## Bug yang diperbaiki sebelum packaging

1. **`submitTransfer` (Pindah Saldo) — bug uang hilang.** Cuma cek lock
   "Tutup Kasir" di akun asal, akun tujuan tidak dicek. Kalau akun tujuan
   sudah ditutup-kasir hari itu, transfer tetap sukses tapi saldonya tidak
   pernah muncul di akun manapun (karena `getSaldo()` skip transaksi
   bertanggal ≤ tanggal closing). Sekarang akun tujuan ikut dicek.
2. **`lunasiKasbon` — bug uang hilang yang sama.** Fungsi ini bikin
   transaksi baru ke akun kas tanpa cek lock closing sama sekali. Kalau
   akun kas itu sudah tutup-kasir hari ini, pelunasan kasbon nyangkut jadi
   uang hilang dari saldo. Ditambahkan guard yang sama seperti transaksi
   biasa.
3. **`renderLock` crash guard.** Kalau kasir yang sedang dipilih di lock
   screen sempat dinonaktifkan, `getKasir()` bisa balikin `undefined` dan
   bikin crash saat baca `.pin_hash`. Ditambah guard, fallback balik ke
   layar pilih kasir.
4. **`sw.js` 404.** `index.html` daftar service worker `sw.js` tapi filenya
   tidak ada di paket asli — sekarang ada file no-op (aplikasi native lewat
   Capacitor sudah offline by default, jadi SW ini cuma buat menghilangkan
   404 di log/console).

## Icon
`www/fhouse.svg` dipakai sebagai sumber semua icon: favicon, apple-touch-icon,
manifest PWA icons, dan launcher icon Android (legacy + adaptive, semua
densitas mdpi–xxxhdpi) di `android/app/src/main/res/mipmap-*`.

## Struktur
```
www/                 -> source web app (yang di-edit kalau mau ubah fitur)
android/              -> native project (auto-generated, jangan edit manual
                          kecuali AndroidManifest/gradle untuk config native)
capacitor.config.json -> appId, appName, webDir
.github/workflows/    -> CI build APK
```

Setelah edit `www/index.html`, jalanin `npx cap copy android` (via
`npm run sync`) sebelum push, supaya `android/app/src/main/assets/public`
ikut ke-update — walau workflow CI juga otomatis `cap sync` sebelum build,
jadi sebenarnya opsional untuk keperluan build, cuma berguna kalau mau test
lokal di Android Studio.
# KASIR-FH-BISMILLAH
