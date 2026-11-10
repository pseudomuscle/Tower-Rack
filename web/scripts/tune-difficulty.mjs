// Penyetel otomatis kesulitan: untuk tiap level, cari pengali kecepatan k
// sehingga peluang selesai pemain "rata-rata" mendekati kurva target yang
// menurun mulus dari level 1 ke 60. Hasil ditulis ke src/tuning.js.
// Aturan tiap level (jumlah lantai, pola gerak, lebar awal, pelebaran) tetap;
// hanya kecepatannya yang disetel, dan tetap sama untuk semua pemain.
//
// Pakai: npm run tune
import { writeFileSync } from 'node:fs';
import { LEVELS } from '../src/levels.js';
import { winRate, PLAYERS } from './difficulty.mjs';

const N = 600;
const K_MIN = 0.5, K_MAX = 1.9;
const kMaxFor = (i) => (i < 5 ? 1.0 : K_MAX); // level 1–5 tetap pelan untuk pemain baru
export const target = (i, n) => 0.99 - 0.89 * Math.pow(i / (n - 1), 1.6);

const scaled = (sp, k) => ({ base: +Math.min(4.2, sp.base * k).toFixed(2), inc: +(sp.inc * k).toFixed(3), max: +Math.min(10, sp.max * k).toFixed(2) });

const out = {};
for (const l of LEVELS) {
  const want = target(l.index, LEVELS.length);
  const raw = l.rawSpeed; // kecepatan sebelum penyetelan (dari kurva dasar)
  let lo = K_MIN, hi = kMaxFor(l.index);
  const rate = (k) => winRate({ ...l, speed: scaled(raw, k) }, PLAYERS.rata2, N, 3);
  if (rate(hi) >= want) lo = hi;        // masih terlalu mudah walau sudah tercepat yang diizinkan
  else if (rate(lo) <= want) hi = lo;   // masih terlalu sulit walau sudah terlambat
  for (let it = 0; it < 12 && hi - lo > 0.005; it++) {
    const mid = (lo + hi) / 2;
    if (rate(mid) > want) lo = mid; else hi = mid;
  }
  const k = +((lo + hi) / 2).toFixed(3);
  out[l.id] = scaled(raw, k);
  const got = rate(k);
  console.log(`${String(l.number).padStart(2)} k=${k.toFixed(3)} target ${(want * 100).toFixed(0).padStart(3)}% dapat ${(got * 100).toFixed(0).padStart(3)}%  ${l.motion.padEnd(6)} ${l.name}`);
}

writeFileSync(new URL('../src/tuning.js', import.meta.url), `// DIBUAT OTOMATIS oleh scripts/tune-difficulty.mjs — jangan diedit manual.
// Kecepatan tiap level hasil penyetelan simulasi pemain (lihat scripts/difficulty.mjs).
export const TUNED_SPEED = ${JSON.stringify(out, null, 2)};
`);
console.log('ditulis src/tuning.js');
