// ID iklan AdMob milik Menara Lapis.
//
// TESTING = true → plugin otomatis memakai unit iklan UJI dari Google walaupun
// ID asli sudah terpasang, jadi aman dicoba di HP sendiri tanpa risiko akun
// AdMob ditangguhkan. Ubah ke false HANYA sebelum rilis produksi di Play Store.
// ID aplikasi (ca-app-pub-...~...) ada di android/app/build.gradle.
export const ADMOB = {
  TESTING: true,
  REWARDED: 'ca-app-pub-8084989145384121/6226320274' // unit "Revive" (Rewarded)
};
