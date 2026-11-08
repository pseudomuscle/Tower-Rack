import { store } from './storage.js';
import { BUILDINGS, levelsIn } from './buildings.js';

const KEY = 'progress';
const blank = () => ({ best: 0, done: false, attempts: 0, clears: 0, completedAt: null, bestPerfects: 0, stars: 0 });

const all = () => store.get(KEY, {});
export const getProgress = (id) => ({ ...blank(), ...(all()[id] || {}) });

function save(id, p) { const a = all(); a[id] = p; store.set(KEY, a); }

export function recordAttempt(id) {
  const p = getProgress(id); p.attempts++; save(id, p);
}

/** Simpan hasil satu permainan. Mengembalikan {firstClear, newBest, newStars}. */
export function recordResult(id, { floors, completed, perfects, stars = 0 }) {
  const p = getProgress(id);
  const newBest = floors > p.best;
  if (newBest) p.best = floors;
  const firstClear = completed && !p.done;
  const newStars = completed && stars > p.stars;
  if (completed) {
    p.done = true; p.clears++;
    if (!p.completedAt) p.completedAt = Date.now();
    p.bestPerfects = Math.max(p.bestPerfects, perfects);
    p.stars = Math.max(p.stars, stars || 1);
  }
  save(id, p);
  return { firstClear, newBest, newStars };
}

/** Level terbuka berurutan: level ke-i terbuka bila level sebelumnya (atau level itu sendiri) sudah selesai. */
export const isUnlocked = (i) => i === 0 || getProgress(BUILDINGS[i].id).done || getProgress(BUILDINGS[i - 1].id).done;
export const collectedCount = () => BUILDINGS.filter((b) => getProgress(b.id).done).length;
export const totalStars = () => BUILDINGS.reduce((n, b) => n + getProgress(b.id).stars, 0);
export const regionStats = (regionId) => {
  const ls = levelsIn(regionId);
  return { done: ls.filter((l) => getProgress(l.id).done).length, total: ls.length, stars: ls.reduce((n, l) => n + getProgress(l.id).stars, 0) };
};
/** Level berikutnya yang perlu dimainkan (pertama yang belum selesai). */
export const nextToPlay = () => BUILDINGS.find((b, i) => isUnlocked(i) && !getProgress(b.id).done) || BUILDINGS[BUILDINGS.length - 1];

export const saveSnapshot = (id, url) => {
  if (!store.set('snap.' + id, url)) { // penyimpanan penuh: hapus foto tertua lalu coba lagi
    const oldest = BUILDINGS.map((b) => ({ id: b.id, t: getProgress(b.id).completedAt || 0 }))
      .filter((x) => x.id !== id && store.get('snap.' + x.id, null)).sort((a, b) => a.t - b.t)[0];
    if (oldest) { store.del('snap.' + oldest.id); store.set('snap.' + id, url); }
  }
};
export const getSnapshot = (id) => store.get('snap.' + id, null);
