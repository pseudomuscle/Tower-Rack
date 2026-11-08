// Jembatan ke fitur aplikasi Android (Capacitor). Di browser semuanya no-op.
import { Capacitor } from '@capacitor/core';
import { ADMOB } from './admob-config.js';

export const isNative = Capacitor.isNativePlatform();

/* ---------- AdMob: iklan hadiah ---------- */
let mod = null, ready = false, loading = null, initP = null;

export function initAds() {
  if (!isNative) return Promise.resolve(false);
  if (!initP) initP = (async () => {
    mod = await import('@capacitor-community/admob');
    await mod.AdMob.initialize({ initializeForTesting: ADMOB.TESTING });
    try { // formulir persetujuan (wajib untuk pemain di Eropa)
      const ci = await mod.AdMob.requestConsentInfo();
      if (ci.isConsentFormAvailable && ci.status === mod.AdmobConsentStatus.REQUIRED) await mod.AdMob.showConsentForm();
    } catch (e) { /* lanjut tanpa formulir */ }
    preload();
    return true;
  })().catch(() => { initP = null; return false; });
  return initP;
}

function preload() {
  if (!mod || ready || loading) return loading;
  loading = mod.AdMob.prepareRewardVideoAd({ adId: ADMOB.REWARDED, isTesting: ADMOB.TESTING })
    .then(() => { ready = true; }).catch(() => { ready = false; }).finally(() => { loading = null; });
  return loading;
}

/** Tampilkan iklan hadiah. Resolve true hanya jika pemain menonton sampai dapat hadiah. */
export async function showRewarded() {
  if (!(await initAds())) return false;
  if (!ready) { await preload(); if (!ready) return false; }
  ready = false;
  const { AdMob, RewardAdPluginEvents: E } = mod;
  return new Promise((resolve) => {
    let rewarded = false, settled = false;
    const hs = [];
    const done = (v) => { if (settled) return; settled = true; hs.forEach((h) => h.remove()); preload(); resolve(v); };
    Promise.all([
      AdMob.addListener(E.Rewarded, () => { rewarded = true; }),
      AdMob.addListener(E.Dismissed, () => done(rewarded)),
      AdMob.addListener(E.FailedToShow, () => done(false))
    ]).then((list) => { hs.push(...list); return AdMob.showRewardVideoAd(); })
      .catch(() => done(false));
  });
}

/* ---------- Tombol kembali Android ---------- */
export async function onBackButton(handler) {
  if (!isNative) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', () => { if (!handler()) App.exitApp(); });
}
