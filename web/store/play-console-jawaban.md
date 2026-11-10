# Jawaban formulir Play Console — Menara Lapis

Panduan isian untuk **Dashboard → Set up your app** (Siapkan aplikasi Anda).
Jawaban di bawah sesuai kondisi game saat ini: tanpa login, tanpa pembelian, data progres hanya
di HP, iklan hadiah dari Google AdMob. Kalau game nanti berubah (misalnya ada login atau
pembelian), formulir ini harus diperbarui juga.

---

## 1. Kebijakan privasi (Privacy policy)
```
https://pseudomuscle.github.io/Tower-Rack/privacy.html
```

## 2. Akses aplikasi (App access)
- Pilih: **Semua fungsi tersedia tanpa akses khusus** (*All functionality is available without special access*).

## 3. Iklan (Ads)
- *Does your app contain ads?* → **Ya (Yes)**.

## 4. Rating konten (Content rating)
- Email: email developer kamu.
- Kategori: **Game**.
- Pertanyaan kuesioner (IARC):
  | Topik | Jawaban |
  |---|---|
  | Kekerasan, darah, menakutkan | **Tidak** |
  | Konten seksual, ketelanjangan | **Tidak** |
  | Bahasa kasar | **Tidak** |
  | Narkoba, alkohol, tembakau | **Tidak** |
  | Perjudian / simulasi judi | **Tidak** |
  | Humor kasar | **Tidak** |
  | Interaksi antar pengguna, chat, berbagi konten buatan pengguna | **Tidak** |
  | Membagikan lokasi pengguna ke pengguna lain | **Tidak** |
  | Pembelian barang digital dalam aplikasi | **Ya** ("Hapus iklan", sekali beli) |
  | Aplikasi berisi iklan | **Ya** (kalau ditanyakan) |
- Hasil yang diharapkan: rating untuk **semua umur** (mis. PEGI 3 / IARC 3+).

## 5. Target audiens dan konten (Target audience and content)
- Kelompok umur target: centang **13–15, 16–17, dan 18+**. **Jangan** centang kelompok di bawah 13.
  (Kalau anak-anak dicentang, aplikasi wajib mengikuti Kebijakan Keluarga Google yang jauh lebih ketat
  untuk iklan dan data.)
- *Could your store listing unintentionally appeal to children?* → **Tidak**.

## 6. Keamanan data (Data safety)
Rujukan resmi Google untuk SDK iklan: <https://developers.google.com/admob/android/privacy/play-data-disclosure>
— cocokkan lagi saat mengisi, karena Google bisa memperbarui panduannya.

**Bagian umum**
| Pertanyaan | Jawaban |
|---|---|
| Apakah aplikasi mengumpulkan atau membagikan data pengguna yang diwajibkan? | **Ya** |
| Apakah semua data dienkripsi saat dikirim? | **Ya** |
| Apakah kamu menyediakan cara bagi pengguna untuk meminta penghapusan data? | **Tidak** (tidak ada akun; progres hanya di HP dan terhapus saat aplikasi di-uninstall) |

**Jenis data yang dicentang** (semuanya dikumpulkan oleh Google Mobile Ads SDK):
| Jenis data | Dikumpulkan | Dibagikan | Diproses sementara? | Wajib/opsional | Tujuan |
|---|---|---|---|---|---|
| **Lokasi → Perkiraan lokasi** (dari alamat IP) | Ya | Ya | Tidak | Wajib | Iklan atau pemasaran; Analitik; Pencegahan penipuan, keamanan & kepatuhan |
| **Aktivitas aplikasi → Interaksi aplikasi lainnya / Interaksi dengan iklan** | Ya | Ya | Tidak | Wajib | Iklan atau pemasaran; Analitik; Pencegahan penipuan, keamanan & kepatuhan |
| **Info & performa aplikasi → Log error / Diagnostik lainnya** | Ya | Ya | Tidak | Wajib | Analitik; Pencegahan penipuan, keamanan & kepatuhan |
| **Perangkat atau ID lainnya** (ID iklan, ID set aplikasi) | Ya | Ya | Tidak | Wajib | Iklan atau pemasaran; Analitik; Pencegahan penipuan, keamanan & kepatuhan |

**Tidak dicentang:** info pribadi (nama, email, alamat, nomor HP), keuangan, kesehatan, pesan, foto/video,
file, kalender, kontak, riwayat penjelajahan, info penginstalan aplikasi lain, lokasi persis.

## 7. ID iklan (Advertising ID)
- *Does your app use advertising ID?* → **Ya**.
- Tujuan: **Iklan atau pemasaran**, **Analitik**, **Pencegahan penipuan, keamanan & kepatuhan**.

## 8. Aplikasi pemerintah / fitur keuangan / kesehatan / berita
- Aplikasi pemerintah → **Tidak**
- Fitur keuangan → **Aplikasi saya tidak menyediakan fitur keuangan**
- Kesehatan → **Tidak**
- Aplikasi berita → **Tidak**

## 9. Kategori & detail kontak (Store settings)
- Jenis aplikasi: **Game**
- Kategori: **Kasual (Casual)**
- Tag yang disarankan: *Kasual*, *Puzzle*, *Satu ketukan*, *Offline*
- Email kontak: email developer kamu (tampil publik di Play Store)
- Situs web (opsional): `https://pseudomuscle.github.io/Tower-Rack/`

## 10. Produk dalam aplikasi "Hapus iklan"
Perlu **profil pembayaran (payments profile)** di Play Console lebih dulu:
**Setelan → Profil pembayaran** — isi data dan rekening bank untuk menerima uang penjualan.
(Ini dikelola Google, tidak memakai Midtrans.)

Lalu: **Monetisasi → Produk → Produk dalam aplikasi → Buat produk**
| Kolom | Isi |
|---|---|
| ID produk | `hapus_iklan` (harus persis sama dengan di kode) |
| Nama | Hapus Iklan |
| Deskripsi | Revive langsung tanpa menonton iklan, selamanya. |
| Harga | mis. **Rp15.000** (bebas; Google mengonversi ke mata uang lain) |

Simpan, lalu **Aktifkan**. Produk hanya bisa dibuat setelah ada AAB yang diunggah ke salah satu jalur
(uji tertutup sudah cukup). Untuk mencoba membeli tanpa ditagih, tambahkan email Gmail-mu di
**Setelan → Pengujian lisensi (License testing)**.

## 11. Aset grafis (Main store listing)
| Aset | File | Ukuran |
|---|---|---|
| Ikon aplikasi | `web/store/icon-512.png` | 512×512 |
| Grafis fitur | `web/store/feature-graphic-1024x500.png` | 1024×500 |
| Screenshot HP (2–8) | `web/store/screenshots/*.png` | 1080×1920 |
| Teks | `web/store/listing-id.md`, `web/store/listing-en.md` | — |
