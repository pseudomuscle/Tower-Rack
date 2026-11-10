// Pengaturan grafis: 'auto' (bawaan), 'high', atau 'low' (Hemat).
// Otomatis memilih Hemat untuk HP dengan RAM/prosesor kecil, dan turun ke
// Hemat bila permainan terasa patah-patah.
import { store } from './storage.js';

const KEY = 'graphics';
const weakDevice = () => (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

export const graphicsSetting = () => store.get(KEY, 'auto');
export function setGraphics(v) { store.set(KEY, v); }
/** Kualitas yang dipakai sekarang: 'high' atau 'low'. */
export function effectiveQuality() {
  const s = graphicsSetting();
  if (s === 'high' || s === 'low') return s;
  return store.get('graphics.autoLow', false) || weakDevice() ? 'low' : 'high';
}
/** Dipanggil mesin game bila FPS rendah dalam mode otomatis. */
export function reportSlow() { if (graphicsSetting() === 'auto') store.set('graphics.autoLow', true); }

export const QUALITY = {
  high: { pixelRatio: 2, shadows: true, farCount: 280, groundTex: 2048 },
  low: { pixelRatio: 1.25, shadows: false, farCount: 110, groundTex: 1024 }
};
