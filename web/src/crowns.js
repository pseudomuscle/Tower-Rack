// Puncak bangunan yang muncul saat level selesai. Model low-poly buatan sendiri.
import * as THREE from 'three';
import { H } from './logic.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const gold = () => std('#f0bf4f', { metalness: 1, roughness: 0.28, emissive: '#5a3a00', emissiveIntensity: 0.25 });
const mesh = (geo, mat, y = 0) => {
  const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; return m;
};

function flame(s) {
  const g = new THREE.Group();
  const marble = std('#efe9dc', { roughness: 0.35 });
  // piramida kecil di ujung tugu
  const tip = mesh(new THREE.CylinderGeometry((s / Math.SQRT2) * 0.62, (s / Math.SQRT2) * 0.98, s * 0.42, 4), marble, s * 0.21);
  tip.rotation.y = Math.PI / 4; g.add(tip);
  // landasan bertingkat & cawan berbentuk mangkuk
  const gd = gold();
  g.add(mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.34, s * 0.06, 20), gd, s * 0.45));
  g.add(mesh(new THREE.CylinderGeometry(s * 0.16, s * 0.24, s * 0.14, 20), gd, s * 0.55));
  // lidah api: kerucut berlekuk yang melengkung
  const fl = new THREE.Group(); fl.position.y = s * 0.62; g.add(fl);
  const tongue = (r, h, x, tilt, seg = 9) => {
    const geo = new THREE.ConeGeometry(r, h, seg, 6);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { // tekuk ke samping semakin ke atas
      const t = (p.getY(k) + h / 2) / h;
      p.setX(k, p.getX(k) + Math.sin(t * Math.PI * 0.9) * tilt * h);
    }
    geo.computeVertexNormals();
    const m = mesh(geo, gd, h / 2); m.position.x = x; return m;
  };
  fl.add(tongue(s * 0.2, s * 0.85, 0, 0.12));
  fl.add(tongue(s * 0.13, s * 0.55, -s * 0.09, -0.22, 8));
  fl.add(tongue(s * 0.12, s * 0.48, s * 0.1, 0.25, 8));
  g.userData.tick = (t) => { fl.scale.set(1 + 0.03 * Math.sin(t * 7), 1 + 0.05 * Math.sin(t * 9.3), 1); };
  g.userData.height = s * 1.5;
  return g;
}

function belfry(s, look) {
  const g = new THREE.Group();
  const R = s * 0.42, h = s * 0.42;
  const facade = look.cylinderMaterial ? look.cylinderMaterial(Math.max(2, Math.round((2 * Math.PI * R) / 1))) : std('#efe3c8');
  // ruang lonceng: silinder bergaleri, sedikit masuk ke dalam
  const core = mesh(new THREE.CylinderGeometry(R, R, h, 32, 1, true), facade, h / 2);
  g.add(core);
  const cream = std('#efe6d2', { roughness: 0.65 });
  g.add(mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, 0.02, 32), cream, 0.01));
  g.add(mesh(new THREE.CylinderGeometry(R * 1.1, R * 1.1, s * 0.05, 32), cream, h + s * 0.025));
  g.add(mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, s * 0.03, 32), cream, h + s * 0.065));
  // atap datar dengan tepi & lonceng emas terlihat di dalam
  g.add(mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.62, s * 0.08, 24), std('#b9ab90'), h + s * 0.12));
  const bell = mesh(new THREE.CylinderGeometry(s * 0.04, s * 0.09, s * 0.12, 12), std('#c7953c', { metalness: 1, roughness: 0.35 }), h * 0.55);
  g.add(bell);
  g.userData.height = h + s * 0.16;
  return g;
}

function spire(s, look) {
  const g = new THREE.Group();
  let y = 0;
  // tingkat-tingkat meruncing, memakai fasad kaca yang sama
  [0.8, 0.62, 0.46, 0.3].forEach((k, n) => {
    const b = { x: 0, z: 0, w: s * k, d: s * k };
    const m = mesh(look.geometry(b, n + 1), look.materials(n + 1), y + H / 2);
    g.add(m); y += H;
  });
  const needleH = s * 1.7;
  const steel = std('#dfe5ea', { metalness: 1, roughness: 0.25 });
  g.add(mesh(new THREE.CylinderGeometry(s * 0.1, s * 0.14, s * 0.15, 8), steel, y + s * 0.075));
  g.add(mesh(new THREE.CylinderGeometry(s * 0.012, s * 0.06, needleH, 8), steel, y + needleH / 2));
  const lampMat = std('#ff4a4a', { emissive: '#ff2020', emissiveIntensity: 3 });
  const lamp = mesh(new THREE.SphereGeometry(s * 0.035, 10, 8), lampMat, y + needleH);
  g.add(lamp);
  g.userData.tick = (t) => { lampMat.emissiveIntensity = Math.sin(t * 4) > 0 ? 3 : 0.1; };
  g.userData.height = y + needleH;
  return g;
}

/** Buat puncak di atas blok `top` (lantai ke-`i`). */
export function buildCrown(kind, top, i, look) {
  const s = Math.max(0.35, Math.min(top.w, top.d));
  const g = kind === 'flame' ? flame(s) : kind === 'belfry' ? belfry(s, look) : spire(s, look);
  g.position.set(top.x, i * H + H / 2, top.z);
  return g;
}
