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

- **60 level di 6 wilayah**: Nusantara, Asia, Eropa, Timur Tengah & Afrika, Amerika, Puncak Dunia.
  Tiap level gedung berbeda (nama samaran, model & tekstur buatan sendiri, hanya *terinspirasi*
  bangunan nyata) dengan fakta singkat tentang bangunan aslinya.
- **Tampilan**: kamera perspektif seperti foto, langit dengan awan & matahari/bulan, kota sampai
  cakrawala, bayangan, pantulan kaca. Waktu berbeda per level: pagi, siang, sore, senja, malam, musim dingin.
- **14 gaya fasad** (kaca, marmer, galeri lengkung, bata, plester, beton, pagoda, belang mercusuar,
  art deco, gotik, mosaik, tanah liat, hutan vertikal, kisi) dan **19 jenis puncak** (lidah api, menara
  jam dengan atap gonjong/limas/kubah, kubah, menara masjid, pagoda, lentera mercusuar, antena TV, dll).
- **Tantangan**: jumlah lantai dan kecepatan naik bertahap; pola gerak *tetap*, *bandul*, dan *berirama*;
  beberapa level berlantai sempit atau tanpa pelebaran. Kesulitan sama untuk semua pemain.
- **Bintang 1–3** per level (dari jumlah pas sempurna), total 180 bintang.
- Level terbuka berurutan; tombol **Lanjutkan** langsung ke level berikutnya.
- **Album Koleksi**: foto menara buatan pemain per wilayah, tanggal selesai, bintang, fakta.
- **Mode bebas**: gameplay prototipe asli.
- Revive via iklan hadiah **simulasi** (sekali per permainan, mulai lantai 3, selalu ada tombol
  "Tidak, terima kasih").

## Struktur

```
web/
  index.html          kerangka layar (menu, HUD, lembar hasil, album, modal iklan)
  src/
    main.js           alur layar & penghubung UI ↔ mesin game
    game.js           mesin 3D: scene, tumpukan, kamera, status permainan
    logic.js          aturan inti murni (potong, sempurna, kecepatan) — dites
    levels.js         60 level, wilayah, waktu, kurva kesulitan  ← atur keseimbangan di sini
    buildings.js      API data bangunan & mode bebas
    facades.js        14 pelukis fasad prosedural (peta warna, relief, kilap, cahaya malam)
    textures.js       material per bangunan, geometri lantai (balok/bundar), list & atap pagoda
    crowns.js         19 jenis puncak bangunan (low-poly)
    scenery.js        alas, tanah, laut, pohon, kota sampai cakrawala, kubah langit, pantulan
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
