# Project Brief — Game Menara (Stack Tower 3D)

Ringkasan dari percakapan desain sebelumnya, untuk dilanjutkan di Claude Code dengan repo GitHub.

## Kondisi pemilik proyek
- Hanya punya **HP** (tidak ada laptop/Mac). Semua build harus lewat cloud (GitHub Actions).
- Target: **Google Play Store** dulu, lalu **App Store**.
- Monetisasi: **iklan hadiah (rewarded ads) via AdMob**, plus opsi "Hapus iklan" berbayar nanti.

## Konsep game
Game kasual satu jari: lapisan bergerak bergantian dari dua sisi (sumbu X lalu Z), pemain mengetuk untuk menjatuhkan. Bagian yang meleset terpotong dan jatuh, sehingga tumpukan makin kecil. Prototipe 3D sudah jadi: `prototype/menara-lapis-3d.html` (Three.js r128, satu file).

### Ide utama yang disepakati: mode level bangunan
- **1 level = 1 bangunan tinggi** (pencakar langit dan bangunan bersejarah). Tiap level punya target jumlah lantai (contoh: 20, 25, 80).
- Lantai memakai **tekstur gaya bangunan itu** (kaca/jendela untuk pencakar langit, batu untuk bangunan bersejarah).
- **Indikator tinggi dalam meter** (misal "212 m / 330 m").
- Saat level selesai: menara tampil utuh dengan puncaknya, plus satu fakta singkat.
- **Album Koleksi Menara** untuk bangunan yang sudah selesai (retensi pemain).
- Bentuk gedung yang meruncing cocok dengan mekanik tumpukan yang mengecil.

Tiga level pertama yang direncanakan (nama samaran, model buatan sendiri):
1. **Tugu Emas Jakarta** (terinspirasi Monas) — mudah
2. **Menara Miring** (terinspirasi Pisa) — sedang
3. **Menara Kaca Gurun** (pencakar langit meruncing) — sulit

## Mekanik yang sudah ada di prototipe
- Ukuran awal lapisan 3×3 unit, tinggi lapisan 0.5.
- Kecepatan naik bertahap per lantai (`min(3.2 + lantai*0.16, 9)` unit/detik), sama untuk semua pemain.
- **Pas sempurna** (meleset ≤ 0.12): lapisan tidak terpotong. **3× sempurna berturut-turut**: lapisan melebar +0.25 (maks ukuran awal).
- Getar ringan saat sempurna, kamera naik mengikuti menara, kamera mundur saat game over.
- Rekor dan statistik iklan disimpan lokal.

## Titik iklan (rewarded, selalu pilihan pemain)
- **Revive**: ditawarkan sekali per permainan saat meleset, mulai skor 3. Hadiah: ulang lapisan terakhir.
- Judul revive jadi **"Hampir pecah rekor!"** saat skor ≥ 70% rekor (momen paling efektif).
- Rencana tambahan: "lebarkan lantai" saat tumpukan terlalu kecil, buka bangunan berikutnya lebih cepat, gandakan hadiah.
- Interstitial (iklan paksa) maksimal sesekali, misal tiap 2–3 game over, tidak pernah di tengah permainan.
- Selalu ada tombol "Tidak, terima kasih" yang jelas. Tidak ada tombol close palsu.
- Catat data: berapa kali revive ditawarkan dan berapa persen diterima.

## Aturan yang harus dijaga (supaya akun store aman)
- **Jangan** memakai nama, logo, atau aset game lain (Block Blast, Stack dari Ketchapp).
- **Jangan** memakai kode hasil reverse engineering aplikasi lain. Konsep boleh, kode harus buatan sendiri.
- **Jangan** sengaja mengatur supaya pemain kalah dekat rekornya ("death algorithm"). Kesulitan harus adil dan sama untuk semua pemain.
- **Foto bangunan**: jangan ambil dari Google. Pakai tekstur/model low-poly buatan sendiri, atau aset berlisensi CC0/public domain dengan lisensi dicek per file.
- **Nama bangunan**: beberapa dilindungi merek dagang/desain (Burj Khalifa, Empire State Building, lampu malam Menara Eiffel). Pakai nama samaran dan model yang terinspirasi, bukan salinan persis. Jangan pakai nama bangunan asli di nama aplikasi atau ikon.
- Jangan pakai akun developer cadangan untuk menghindari suspend (Google bisa menautkan akun).

## Rencana teknis
1. Bangun mode level 3 bangunan di versi web (Three.js), sampai gameplay terasa pas.
2. Bungkus jadi aplikasi dengan **Capacitor**, tambahkan AdMob (`@capacitor-community/admob`), awali dengan ID iklan tes.
3. **GitHub Actions**: build Android (.aab bertanda tangan) di runner Linux, build iOS di runner macOS.
4. Upload ke Play Console / App Store Connect dari HP.

## Biaya yang perlu disiapkan pemilik
- Google Play Console: sekitar $25 sekali bayar.
- Apple Developer Program: sekitar $99 per tahun.
- AdMob: gratis.

## Langkah pertama untuk Claude Code
1. ✅ Buat struktur repo: `web/` (game Three.js, dipecah dari prototipe jadi beberapa modul), `README.md`, file ini.
2. ✅ Implementasikan mode level + 3 bangunan + layar menara selesai + album koleksi.
3. Setelah gameplay disetujui, tambahkan Capacitor + AdMob + workflow GitHub Actions.
   (Sudah ada: workflow **Web** untuk tes, build, dan deploy ke GitHub Pages.)

## Status
- Versi web: Vite + Three.js 0.170 (dipaket lokal supaya nanti jalan offline di Capacitor).
- 60 level / 6 wilayah, kamera perspektif, bintang 1–3, album per wilayah.
- Keseimbangan level ada di `web/src/levels.js` (kurva kecepatan dihitung dari urutan level; bisa ditimpa per level).
- Iklan masih simulasi (`web/src/ads.js`); titik ganti ke AdMob ada di `playRewardedAd()`.
- Android: Capacitor 8 + AdMob (ID uji), workflow `android.yml` membuat APK uji dan AAB bertanda tangan (jika secret diisi), dirilis ke GitHub Release `android-latest`.
- Versi Artifact (satu file) dibuat dengan `npm run build && npm run artifact`.
