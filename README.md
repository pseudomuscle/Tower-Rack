# Tower-Rack — Menara Lapis

Game kasual 3D satu jari: tumpuk lantai bangunan sampai menaranya selesai.

- Konsep dan rencana: [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
- Prototipe awal (satu file, tidak diubah lagi): `prototype/menara-lapis-3d.html`
- Game yang dikembangkan: folder [`web/`](web/)

## Main dari HP

Semua build berjalan di **GitHub Actions** — tidak perlu laptop.

1. Sekali saja: buka repo di browser HP → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Gabungkan (merge) perubahan ke branch `main`.
3. Tunggu workflow **Web** selesai (tab **Actions**, tanda centang hijau).
4. Buka `https://pseudomuscle.github.io/Tower-Rack/` di HP.

Setiap push ke branch lain / pull request tetap menjalankan tes + build, dan hasilnya
bisa diunduh dari halaman run di tab Actions (artifact `menara-web`).

## Isi game sekarang

- **Mode level, 3 bangunan** (nama samaran, model & tekstur buatan sendiri):
  1. Tugu Emas Jakarta — mudah, 20 lantai, 132 m
  2. Menara Miring — sedang, 30 lantai, 56 m (menara miring saat selesai)
  3. Menara Kaca Gurun — sulit, 60 lantai, 800 m
- Bangunan berikutnya terbuka setelah yang sebelumnya selesai.
- Indikator tinggi dalam meter (`79 m / 132 m`) + bilah progres.
- **Layar menara selesai**: puncak bangunan muncul, kamera mundur & berputar, fakta singkat.
- **Album Koleksi Menara**: foto menara buatan pemain sendiri (diambil otomatis saat selesai),
  tanggal selesai, jumlah percobaan, dan fakta.
- **Mode bebas**: gameplay prototipe asli (tanpa target).
- Revive via iklan hadiah **simulasi** (sekali per permainan, mulai lantai 3, selalu ada
  tombol "Tidak, terima kasih"). Judul: "Hampir sampai puncak!" saat ≥70% target,
  "Hampir pecah rekor!" saat ≥70% rekor.

## Struktur

```
web/
  index.html          kerangka layar (menu, HUD, lembar hasil, album, modal iklan)
  src/
    main.js           alur layar & penghubung UI ↔ mesin game
    game.js           mesin 3D: scene, tumpukan, kamera, status permainan
    logic.js          aturan inti murni (potong, sempurna, kecepatan) — dites
    buildings.js      data level: lantai, tinggi, kecepatan, warna, fakta  ← atur keseimbangan di sini
    textures.js       tekstur PBR prosedural (marmer, galeri lengkung, kaca) di <canvas>
    crowns.js         puncak bangunan (low-poly)
    scenery.js        alas bangunan, tanah, pohon, kota sekitar, langit pantulan
    menu.js           menu utama & Album Koleksi
    progress.js       simpan progres, kunci level, foto album
    ads.js            iklan hadiah (sekarang simulasi; nanti diganti AdMob)
    storage.js        localStorage yang aman
    style.css
  test/logic.test.js  tes aturan inti (node --test)
.github/workflows/web.yml   tes + build + deploy GitHub Pages
```

## Main langsung di aplikasi Claude

Game juga diterbitkan sebagai Artifact (satu file HTML mandiri) supaya bisa dibuka dari aplikasi Claude:
`npm run build && npm run artifact` → `web/dist-artifact/menara-lapis.html`.

## Pengembangan (opsional, kalau ada komputer)

```
cd web
npm install
npm run dev     # server lokal
npm test
npm run build   # hasil di web/dist
```
