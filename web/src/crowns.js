// Puncak bangunan yang muncul saat level selesai. Model low-poly buatan sendiri.
import * as THREE from 'three';
import { H } from './logic.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const gold = () => lambert('#f2c037', { emissive: '#8a5a00', emissiveIntensity: 0.6 });
const mesh = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; return m; };

function flame(s) {
  const g = new THREE.Group();
  const stone = lambert('#f1ebde');
  const tip = mesh(new THREE.ConeGeometry((s / Math.SQRT2) * 0.98, s * 0.55, 4), stone, s * 0.275);
  tip.rotation.y = Math.PI / 4;
  g.add(tip);
  const g1 = gold();
  g.add(mesh(new THREE.CylinderGeometry(s * 0.14, s * 0.2, s * 0.2, 12), g1, s * 0.62));
  const fl = new THREE.Group(); fl.position.y = s * 0.72; g.add(fl);
  const main = mesh(new THREE.ConeGeometry(s * 0.2, s * 0.8, 8), g1, s * 0.4); fl.add(main);
  [-1, 1].forEach((side) => {
    const f = mesh(new THREE.ConeGeometry(s * 0.12, s * 0.48, 7), g1, s * 0.24);
    f.position.x = side * s * 0.1; f.rotation.z = -side * 0.38; fl.add(f);
  });
  g.userData.tick = (t) => { fl.scale.set(1 + 0.04 * Math.sin(t * 7), 1 + 0.08 * Math.sin(t * 9.3), 1); };
  g.userData.height = s * 1.55;
  return g;
}

function belfry(s) {
  const g = new THREE.Group();
  const cream = lambert('#efe3c8'), dark = lambert('#4d3e2f');
  const R = s * 0.4, h = s * 0.42;
  g.add(mesh(new THREE.CylinderGeometry(R * 0.92, R * 0.92, h, 16), dark, h / 2));
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const col = mesh(new THREE.CylinderGeometry(s * 0.035, s * 0.035, h, 6), cream, h / 2);
    col.position.x = Math.cos(a) * R; col.position.z = Math.sin(a) * R; g.add(col);
  }
  g.add(mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, s * 0.08, 18), cream, h + s * 0.04));
  g.add(mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.7, s * 0.14, 14), cream, h + s * 0.15));
  g.add(mesh(new THREE.SphereGeometry(s * 0.09, 10, 8), gold(), h * 0.55));
  g.userData.height = h + s * 0.22;
  return g;
}

function spire(s, look) {
  const g = new THREE.Group();
  let y = 0;
  [0.78, 0.58, 0.4].forEach((k) => {
    const hh = s * 0.32;
    g.add(mesh(new THREE.BoxGeometry(s * k, hh, s * k), look.sideMaterial, y + hh / 2));
    y += hh;
  });
  const needleH = s * 1.5;
  g.add(mesh(new THREE.ConeGeometry(s * 0.06, needleH, 6), lambert('#e3e9ee'), y + needleH / 2));
  const lampMat = lambert('#ff4a4a', { emissive: '#ff2020', emissiveIntensity: 1 });
  const lamp = mesh(new THREE.SphereGeometry(s * 0.05, 8, 6), lampMat, y + needleH);
  g.add(lamp);
  g.userData.tick = (t) => { lampMat.emissiveIntensity = Math.sin(t * 4) > 0 ? 1 : 0.1; };
  g.userData.height = y + needleH;
  return g;
}

/** Buat puncak di atas blok `top` (lantai ke-`i`). */
export function buildCrown(kind, top, i, look) {
  const s = Math.max(0.35, Math.min(top.w, top.d));
  const g = kind === 'flame' ? flame(s) : kind === 'belfry' ? belfry(s) : spire(s, look);
  g.position.set(top.x, i * H + H / 2, top.z);
  return g;
}

/** Dekorasi tanah kecil sesuai lokasi. */
export function buildDecor(kind) {
  const g = new THREE.Group();
  if (!kind) return g;
  const spots = (n, r, phase = 0) => Array.from({ length: n }, (_, k) => {
    const a = phase + (k / n) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r];
  });
  if (kind === 'trees') {
    const leaf = lambert('#3f8f47'), trunk = lambert('#7a5232');
    spots(8, 4.1, 0.3).forEach(([x, z], k) => {
      const t = new THREE.Group();
      t.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 6), trunk, 0.2));
      t.add(mesh(new THREE.IcosahedronGeometry(0.34 + (k % 3) * 0.06, 0), leaf, 0.62));
      t.position.set(x, 0, z); g.add(t);
    });
  } else if (kind === 'cypress') {
    const leaf = lambert('#2f6b3a');
    spots(6, 4.2, 0.5).forEach(([x, z], k) => {
      const c = mesh(new THREE.ConeGeometry(0.2, 1.1 + (k % 2) * 0.3, 7), leaf, 0.6);
      c.position.x = x; c.position.z = z; g.add(c);
    });
  } else if (kind === 'dunes') {
    const sand = lambert('#d6aa6b');
    spots(5, 4.0, 0.2).forEach(([x, z], k) => {
      const d = mesh(new THREE.SphereGeometry(0.7 + (k % 2) * 0.3, 10, 6), sand, -0.1);
      d.scale.y = 0.35; d.position.x = x; d.position.z = z; g.add(d);
    });
  }
  return g;
}
