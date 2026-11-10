// Simulasi pemain untuk menilai tingkat kesulitan 60 level.
// Model: pemain mengetuk saat lantai sejajar, dengan galat waktu acak
// (distribusi normal, simpangan baku SIGMA detik). Galat posisi = kecepatan
// lantai saat melintas × galat waktu. Aturan potong/sempurna/melebar memakai
// logic.js yang sama dengan game, jadi hasilnya mencerminkan game sebenarnya.
//
// Pakai: node web/scripts/difficulty.mjs [jumlahPercobaan]
import { resolveDrop, speedFor, axisFor, START } from '../src/logic.js';
import { LEVELS } from '../src/levels.js';

export const PLAYERS = { santai: 0.055, rata2: 0.04, mahir: 0.026 }; // simpangan baku galat ketuk (detik)

function gauss(rand) { // Box–Muller
  let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Kecepatan lantai saat melintas di tengah, menurut pola gerak. */
function crossSpeed(v, motion, rand) {
  if (motion === 'ease') return v * (0.5 + Math.PI / 4);           // bandul: 1,29× di tengah
  if (motion === 'pulse') return v * (1 + 0.35 * Math.sin(rand() * Math.PI * 2));
  return v;
}

/** Satu percobaan: true jika menara selesai tanpa revive. */
export function attempt(level, sigma, rand) {
  const start = level.start || START;
  let top = { x: 0, z: 0, w: start, d: start }, streak = 0;
  for (let i = 1; i <= level.floors; i++) {
    const axis = axisFor(i), v = speedFor(i, level.speed);
    const err = crossSpeed(v, level.motion, rand) * sigma * gauss(rand);
    const cur = { ...top }; cur[axis] = top[axis] + err;
    const r = resolveDrop(top, cur, axis, streak, start, level.grow !== false);
    if (r.result === 'miss') return false;
    top = r.block; streak = r.streak;
  }
  return true;
}

export function winRate(level, sigma, n = 400, seed = 1) {
  const rand = rng(seed * 7919 + level.index * 104729);
  let w = 0;
  for (let k = 0; k < n; k++) if (attempt(level, sigma, rand)) w++;
  return w / n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = +process.argv[2] || 400;
  console.log('lvl  lantai gerak   mulai | santai  rata2  mahir | nama');
  for (const l of LEVELS) {
    const r = Object.values(PLAYERS).map((s) => (winRate(l, s, n) * 100).toFixed(0).padStart(5) + '%');
    console.log(`${String(l.number).padStart(3)}  ${String(l.floors).padStart(5)}  ${l.motion.padEnd(6)} ${String(l.start).padEnd(4)}${l.grow ? ' ' : '*'}| ${r.join(' ')} | ${l.name}`);
  }
}
