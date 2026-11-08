// ID iklan AdMob. Sekarang memakai ID UJI resmi dari Google (aman diklik,
// tidak menghasilkan uang, tidak melanggar aturan). Setelah akun AdMob dibuat,
// ganti REWARDED dengan ID unit iklan asli dan set TESTING = false.
// ID aplikasi AdMob (ca-app-pub-...~...) diatur terpisah lewat variabel
// ADMOB_APP_ID di GitHub (lihat .github/workflows/android.yml).
export const ADMOB = {
  TESTING: true,
  REWARDED: 'ca-app-pub-3940256099942544/5224354917' // unit uji "rewarded" dari Google
};
