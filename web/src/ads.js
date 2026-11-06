// Iklan hadiah (rewarded). Sekarang SIMULASI. Saat Capacitor + AdMob dipasang,
// cukup ganti isi `playRewardedAd()` dengan pemanggilan plugin AdMob.
import { store } from './storage.js';

const SK = 'adstats';
const blank = { plays: 0, offered: 0, accepted: 0 };
export const adStats = () => ({ ...blank, ...store.get(SK, {}) });
export function track(field) { const s = adStats(); s[field]++; store.set(SK, s); }
export function resetAdStats() { store.set(SK, { ...blank }); }

const $ = (id) => document.getElementById(id);

/** Putar iklan. Resolve true jika hadiah didapat. */
function playRewardedAd() {
  return new Promise((resolve) => {
    $('adActions').hidden = true;
    $('adPlaying').hidden = false;
    let n = 3;
    $('adCount').textContent = n;
    const t = setInterval(() => {
      n--; $('adCount').textContent = n;
      if (n <= 0) { clearInterval(t); resolve(true); }
    }, 1000);
  });
}

/**
 * Tawarkan iklan hadiah. Selalu pilihan pemain, dengan tombol
 * "Tidak, terima kasih" yang jelas. Resolve true jika pemain menonton sampai selesai.
 */
export function offerReward({ title, text, watchLabel = '▶ Tonton iklan & lanjut' }) {
  track('offered');
  const modal = $('adModal');
  $('adTitle').textContent = title;
  $('adText').textContent = text;
  $('adWatch').textContent = watchLabel;
  $('adPlaying').hidden = true;
  $('adActions').hidden = false;
  modal.hidden = false;
  $('adWatch').focus();
  return new Promise((resolve) => {
    const done = (ok) => { modal.hidden = true; $('adWatch').onclick = $('adSkip').onclick = null; resolve(ok); };
    $('adWatch').onclick = async () => {
      const ok = await playRewardedAd();
      if (ok) track('accepted');
      done(ok);
    };
    $('adSkip').onclick = () => done(false);
  });
}

export const adOpen = () => !$('adModal').hidden;
