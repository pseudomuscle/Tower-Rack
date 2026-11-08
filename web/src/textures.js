// "Look" satu bangunan: material PBR bersama (dari fasad prosedural di
// facades.js) + pembuat geometri lantai + tambahan per lantai (list, atap
// pagoda, balkon).
import * as THREE from 'three';
import { H } from './logic.js';
import { FACADES, drawRoof, NF } from './facades.js';

export { rng } from './facades.js';

// Bawaan tiap gaya: kekuatan relief, warna atap, warna lantai dasar.
const DEFAULTS = {
  glass: { bump: 1.2, roof: '#6d7880', base: '#8d969d', tints: ['#ffffff', '#f4f8fb'] },
  marble: { bump: 0.8, roof: '#e7e0d2', base: '#cfc7b6' },
  arcade: { bump: 1.4, roof: '#e3d6ba', base: '#cbbd9e', ledge: 'cornice', ledgeColor: '#efe7d4' },
  brick: { bump: 1.3, roof: '#8a7c6e', base: '#a89c8c' },
  plaster: { bump: 0.9, roof: '#d9d1c2', base: '#cfc6b6' },
  concrete: { bump: 0.9, roof: '#a9a6a0', base: '#b3afa8' },
  pagoda: { bump: 1.1, roof: '#4a4e55', base: '#8c3a2f', ledge: 'eave', ledgeColor: '#3d4148' },
  stripes: { bump: 0.6, roof: '#d8d3c8', base: '#d6d1c6' },
  deco: { bump: 1.3, roof: '#b9b0a0', base: '#bdb3a1' },
  gothic: { bump: 1.5, roof: '#8f8471', base: '#b3a27c' },
  mosaic: { bump: 0.9, roof: '#d9cfbd', base: '#d0c4ad' },
  adobe: { bump: 1.6, roof: '#b38c5e', base: '#b08b60' },
  green: { bump: 1.6, roof: '#7b8a6a', base: '#9a9a92', ledge: 'slab', ledgeColor: '#e6e3dc' },
  lattice: { bump: 1.4, roof: '#9aa0a4', base: '#b5b1aa' }
};
const CAKE = ['#e05a7a', '#f7e6c4', '#4fae6b', '#f7e6c4', '#8a5634', '#f7e6c4', '#f2a541', '#f7e6c4', '#7a6fd6', '#f7e6c4'];

const shared = (m) => { m.userData.shared = true; return m; };
const cache = new Map(); // kanvas fasad per gaya+opsi (dipakai ulang saat main ulang)

function canvasTexture(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Geometri balok: UV mengikuti posisi dunia supaya pola menyambung saat lantai terpotong. */
function blockGeometry(b, i) {
  const geo = new THREE.BoxGeometry(b.w, H, b.d);
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  const f = ((i % NF) + NF) % NF;
  for (let k = 0; k < p.count; k++) {
    const nx = n.getX(k), ny = n.getY(k), nz = n.getZ(k);
    const wx = p.getX(k) + b.x, wz = p.getZ(k) + b.z;
    if (Math.abs(ny) > 0.5) { uv.setXY(k, wx, -wz); continue; }
    const u = nx > 0.5 ? -wz : nx < -0.5 ? wz : nz > 0.5 ? wx : -wx;
    uv.setXY(k, u, (f + (p.getY(k) + H / 2) / H) / NF);
  }
  return geo;
}

/** Lantai bundar (elips di dalam kotak w×d). Cocok dengan aturan potong di sumbu gerak. */
function roundGeometry(b, i) {
  const geo = new THREE.CylinderGeometry(0.5, 0.5, H, 48, 1, false);
  const uv0 = geo.attributes.uv.array.slice();
  geo.scale(b.w, 1, b.d);
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  const f = ((i % NF) + NF) % NF;
  const around = Math.max(1, Math.round((Math.PI * (b.w + b.d)) / 2));
  for (let k = 0; k < p.count; k++) {
    const wx = p.getX(k) + b.x, wz = p.getZ(k) + b.z;
    if (Math.abs(n.getY(k)) > 0.5) { uv.setXY(k, wx, -wz); continue; }
    uv.setXY(k, uv0[k * 2] * around, (f + (p.getY(k) + H / 2) / H) / NF);
  }
  return geo;
}

/** Tambahan per lantai. Puncaknya sedikit di bawah atap lantai supaya tidak z-fighting. */
function ledgeGeometry(kind, b, round) {
  if (kind === 'eave') { // atap genteng pagoda yang melebar
    const seg = round ? 24 : 4, hh = 0.13;
    const rt = (b.w + 0.06) / (round ? 2 : Math.SQRT2), rb = (b.w + 0.75) / (round ? 2 : Math.SQRT2);
    const g = new THREE.CylinderGeometry(rt, rb, hh, seg);
    if (!round) g.rotateY(Math.PI / 4);
    g.scale(1, 1, (b.d + 0.4) / (b.w + 0.4));
    g.translate(0, H / 2 - hh / 2 - 0.006, 0);
    return g;
  }
  const out = kind === 'slab' ? 0.14 : 0.08, hh = kind === 'slab' ? 0.04 : 0.055;
  let g;
  if (round) { g = new THREE.CylinderGeometry(0.5, 0.5, hh, 48); g.scale(b.w + out, 1, b.d + out); }
  else g = new THREE.BoxGeometry(b.w + out, hh, b.d + out);
  g.translate(0, H / 2 - hh / 2 - 0.006, 0);
  return g;
}

/**
 * Buat "look" untuk satu bangunan.
 * b.facade = { style, ...opsi pelukis }, b.round, b.ledge, b.glow (cahaya jendela malam).
 */
export function createLook(building) {
  if (building.style === 'cake') {
    const mats = CAKE.map((c) => shared(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })));
    return {
      materials: (i) => mats[i % mats.length],
      geometry: (b) => new THREE.BoxGeometry(b.w, H, b.d),
      decorate() {},
      dispose() { mats.forEach((m) => m.dispose()); }
    };
  }
  const F = building.facade;
  const D = { ...DEFAULTS[F.style] };
  const key = JSON.stringify(F);
  if (!cache.has(key)) { if (cache.size > 6) cache.clear(); cache.set(key, FACADES[F.style](F)); }
  const L = cache.get(key);
  const map = canvasTexture(L.c, true), bump = canvasTexture(L.b, false), orm = canvasTexture(L.m, false), emis = canvasTexture(L.e, true);
  const R = drawRoof({ base: [40, 8, 70], joint: '#8f877a', tile: 256, rough: 0.8 });
  const rMap = canvasTexture(R.c, true), rBump = canvasTexture(R.b, false);
  const textures = [map, bump, orm, emis, rMap, rBump];
  const round = !!building.round;
  const glow = building.glow ?? 0.4;

  const sideProps = (color) => ({
    color, map, bumpMap: bump, bumpScale: D.bump, roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1,
    emissiveMap: emis, emissive: '#ffffff', emissiveIntensity: glow
  });
  const tints = building.tints || D.tints || ['#ffffff', '#fbf9f5'];
  const sides = tints.map((c) => shared(new THREE.MeshStandardMaterial(sideProps(c))));
  const baseSide = shared(new THREE.MeshStandardMaterial({ ...sideProps(building.baseTint || D.base), emissiveIntensity: glow * 0.3 }));
  const roofCol = building.roofColor || D.roof;
  // Tutup silinder = kipas segitiga tipis; tekstur memunculkan garis jari-jari, jadi warna polos.
  const roof = shared(round
    ? new THREE.MeshStandardMaterial({ color: roofCol, roughness: 0.8 })
    : new THREE.MeshStandardMaterial({ color: roofCol, map: rMap, bumpMap: rBump, bumpScale: 0.6, roughness: 0.85 }));
  const ledgeKind = building.ledge === undefined ? D.ledge : building.ledge;
  const ledge = ledgeKind ? shared(new THREE.MeshStandardMaterial({ color: building.ledgeColor || D.ledgeColor || '#e8e2d4', roughness: 0.7 })) : null;
  const mats = [...sides, baseSide, roof, ledge].filter(Boolean);
  // Kotak: grup +x,-x,+y,-y,+z,-z. Silinder: sisi, tutup atas, tutup bawah.
  const arr = sides.map((s) => (round ? [s, roof, roof] : [s, s, roof, roof, s, s]));
  const baseArr = round ? [baseSide, roof, roof] : [baseSide, baseSide, roof, roof, baseSide, baseSide];

  return {
    materials: (i) => (i === 0 ? baseArr : arr[i % arr.length]),
    geometry: round ? roundGeometry : blockGeometry,
    sideMaterial: sides[0],
    roofMaterial: roof,
    round,
    decorate(mesh, b) {
      if (!ledge) return;
      const l = new THREE.Mesh(ledgeGeometry(ledgeKind, b, round), ledge);
      l.castShadow = true; l.receiveShadow = true;
      mesh.add(l);
    },
    /** Material fasad untuk silinder di puncak (mis. ruang lonceng): pola diulang `around` kali. */
    cylinderMaterial(around) {
      const clone = (t) => { const c = t.clone(); c.repeat.set(around, 1 / NF); c.needsUpdate = true; return c; };
      const m = new THREE.MeshStandardMaterial({ ...sideProps('#ffffff'), map: clone(map), bumpMap: clone(bump), roughnessMap: clone(orm), emissiveMap: clone(emis), metalnessMap: null, metalness: 0 });
      m.userData.ownTextures = [m.map, m.bumpMap, m.roughnessMap, m.emissiveMap];
      return m;
    },
    dispose() { textures.forEach((t) => t.dispose()); mats.forEach((m) => m.dispose()); }
  };
}

/** Buang geometri & material milik sendiri (material bersama dilewati). */
export function disposeObject(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m) => {
      if (m.userData.shared) return;
      (m.userData.ownTextures || []).forEach((t) => t && t.dispose());
      m.dispose();
    });
  });
}
