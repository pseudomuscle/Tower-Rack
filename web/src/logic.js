// Aturan inti tumpukan. Murni (tanpa Three.js / DOM) supaya bisa dites di Node.

export const H = 0.5;          // tinggi satu lantai (unit dunia)
export const START = 3;        // ukuran awal lantai 3×3
export const RANGE = 4.6;      // jarak gerak lantai dari pusat
export const PERFECT = 0.12;   // meleset ≤ ini dihitung pas sempurna
export const GROW = 0.25;      // pelebaran setelah 3× sempurna berturut-turut
export const GROW_STREAK = 3;

/** Lantai ganjil bergerak di sumbu X, genap di sumbu Z. */
export const axisFor = (i) => (i % 2 ? 'x' : 'z');

/**
 * Kecepatan lantai ke-i. Sama untuk semua pemain (tidak ada penyesuaian
 * diam-diam berdasarkan rekor pemain).
 */
export const speedFor = (i, sp) => Math.min(sp.base + i * sp.inc, sp.max);

/**
 * Hitung hasil menjatuhkan lantai `cur` di atas `top`.
 * Blok: {x, z, w, d}. Mengembalikan:
 *  - {result:'miss', streak:0}
 *  - {result:'perfect'|'cut', block, chip|null, streak, grew}
 */
export function resolveDrop(top, cur, axis, streak, start = START) {
  const key = axis === 'x' ? 'w' : 'd';
  const size = top[key];
  const delta = cur[axis] - top[axis];
  const over = Math.abs(delta);
  if (over >= size) return { result: 'miss', streak: 0 };

  const block = { x: cur.x, z: cur.z, w: cur.w, d: cur.d };
  if (over <= PERFECT) {
    const s = streak + 1;
    let ns = size;
    if (s >= GROW_STREAK) ns = Math.min(start, size + GROW);
    block[key] = ns;
    block[axis] = top[axis];
    return { result: 'perfect', block, chip: null, streak: s, grew: ns > size };
  }

  const ns = size - over;
  const nc = top[axis] + delta / 2;
  block[key] = ns;
  block[axis] = nc;
  const chip = { x: cur.x, z: cur.z, w: cur.w, d: cur.d };
  chip[key] = over;
  chip[axis] = nc + Math.sign(delta) * (ns / 2 + over / 2);
  return { result: 'cut', block, chip, streak: 0, grew: false };
}

/** Tinggi dalam meter untuk sejumlah lantai pada bangunan tertentu. */
export const metersAt = (floors, b) =>
  Number.isFinite(b.floors) ? Math.round((Math.min(floors, b.floors) * b.heightM) / b.floors) : 0;

/** Judul tawaran revive. */
export function reviveTitle({ floors, target, best }) {
  if (Number.isFinite(target) && floors >= target * 0.7) return 'Hampir sampai puncak!';
  if (best > 0 && floors >= best * 0.7) return 'Hampir pecah rekor!';
  return 'Lanjut membangun?';
}

/** Revive ditawarkan sekali per permainan, mulai lantai 3. */
export const canRevive = (floors, revived) => !revived && floors >= 3;
