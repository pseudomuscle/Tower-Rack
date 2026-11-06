import { store } from './storage.js';
import { BUILDINGS } from './buildings.js';

const KEY = 'progress';
const blank = () => ({ best: 0, done: false, attempts: 0, clears: 0, completedAt: null, bestPerfects: 0 });

const all = () => store.get(KEY, {});
export const getProgress = (id) => ({ ...blank(), ...(all()[id] || {}) });

function save(id, p) { const a = all(); a[id] = p; store.set(KEY, a); }

export function recordAttempt(id) {
  const p = getProgress(id); p.attempts++; save(id, p);
}

/** Simpan hasil satu permainan. Mengembalikan {firstClear, newBest}. */
export function recordResult(id, { floors, completed, perfects }) {
  const p = getProgress(id);
  const newBest = floors > p.best;
  if (newBest) p.best = floors;
  const firstClear = completed && !p.done;
  if (completed) {
    p.done = true; p.clears++;
    if (!p.completedAt) p.completedAt = Date.now();
    p.bestPerfects = Math.max(p.bestPerfects, perfects);
  }
  save(id, p);
  return { firstClear, newBest };
}

export const isUnlocked = (i) => i === 0 || getProgress(BUILDINGS[i - 1].id).done;
export const collectedCount = () => BUILDINGS.filter((b) => getProgress(b.id).done).length;

export const saveSnapshot = (id, url) => store.set('snap.' + id, url);
export const getSnapshot = (id) => store.get('snap.' + id, null);
