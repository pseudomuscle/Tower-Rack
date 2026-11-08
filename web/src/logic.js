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
export function resolveDrop(top, cur, axis, streak, start = START, grow = true) {
  const key = axis === 'x' ? 'w' : 'd';
  const size = top[key];
  const delta = cur[axis] - top[axis];
  const over = Math.abs(delta);
  if (over >= size) return { result: 'miss', streak: 0 };

  const block = { x: cur.x, z: cur.z, w: cur.w, d: cur.d };
  if (over <= PERFECT) {
    const s = streak + 1;
    let ns = size;
    if (grow && s >= GROW_STREAK) ns = Math.max(size, Math.min(start, size + GROW));
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

/** Bintang 1–3 dari porsi lantai yang pas sempurna. */
export const STAR_RULES = [0.3, 0.55];
export function starsFor(perfects, floors) {
  if (!floors) return 0;
  const r = perfects / floors;
  return r >= STAR_RULES[1] ? 3 : r >= STAR_RULES[0] ? 2 : 1;
}

/**
 * Posisi lantai bergerak. Pola `linear` (kecepatan tetap), `ease` (seperti
 * bandul: cepat di tengah, melambat di ujung), atau `pulse` (kecepatan naik
 * turun berirama). Ketiganya punya periode yang sama, jadi tetap adil.
 * Mengembalikan {pos, phase}; `phase` ∈ [0, 2) menyatakan posisi dalam satu siklus.
 */
export function advance(phase, speed, dt, motion, t) {
  const period = (4 * RANGE) / speed; // waktu bolak-balik penuh
  let rate = 2 / period;
  if (motion === 'pulse') rate *= 1 + 0.35 * Math.sin(t * 2.2);
  phase = (phase + rate * dt) % 2;
  const tri = phase < 1 ? phase : 2 - phase; // 0→1→0
  const k = motion === 'ease' ? (1 - Math.cos(tri * Math.PI)) / 2 : tri;
  return { pos: -RANGE + 2 * RANGE * k, phase };
}
