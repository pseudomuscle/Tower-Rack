// Puncak bangunan yang muncul saat level selesai. Model low-poly buatan sendiri.
// buildCrown(kind, topBlock, floorIndex, look, opts)
import * as THREE from 'three';
import { H } from './logic.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const metal = (color, rough = 0.28) => std(color, { metalness: 1, roughness: rough });
const gold = () => std('#f0bf4f', { metalness: 1, roughness: 0.28, emissive: '#5a3a00', emissiveIntensity: 0.25 });
const glow = (color, k = 3) => std(color, { emissive: color, emissiveIntensity: k });
const mesh = (geo, mat, y = 0) => {
  const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; return m;
};
const cyl = (rt, rb, h, mat, y, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, y + h / 2);
const pyramid = (side, h, mat, y) => { const m = mesh(new THREE.CylinderGeometry(0, side / Math.SQRT2, h, 4), mat, y + h / 2); m.rotation.y = Math.PI / 4; return m; };
const box = (w, h, d, mat, y) => mesh(new THREE.BoxGeometry(w, h, d), mat, y + h / 2);
const MATS = { gold, copper: () => std('#5f9e8a', { roughness: 0.5, metalness: 0.3 }), slate: () => std('#3b3e46', { roughness: 0.55 }),
  red: () => std('#b5382e', { roughness: 0.5 }), white: () => std('#f1ede4', { roughness: 0.45 }), steel: () => metal('#dfe5ea', 0.25),
  green: () => std('#2f7d5b', { roughness: 0.45 }), stone: () => std('#d8cdb6', { roughness: 0.7 }), black: () => std('#2a2d31', { roughness: 0.4 }),
  blue: () => std('#2f6fa6', { roughness: 0.35, metalness: 0.4 }), terracotta: () => std('#b5552f', { roughness: 0.7 }) };
const mat = (name, fallback = 'stone') => (MATS[name] || MATS[fallback])();

/** Kerucut melengkung (lidah api, tanduk atap gonjong). */
function tongue(r, h, tilt, m, seg = 9) {
  const geo = new THREE.ConeGeometry(r, h, seg, 6);
  const p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const t = (p.getY(k) + h / 2) / h;
    p.setX(k, p.getX(k) + Math.sin(t * Math.PI * 0.9) * tilt * h);
  }
  geo.computeVertexNormals();
  geo.translate(0, h / 2, 0);
  return mesh(geo, m);
}

function finial(g, y, s, m) { // tiang kecil + bola di ujung
  g.add(cyl(s * 0.015, s * 0.025, s * 0.25, m, y, 8));
  g.add(mesh(new THREE.SphereGeometry(s * 0.04, 12, 8), m, y + s * 0.27));
  return y + s * 0.31;
}

const K = {
  flame(s) {
    const g = new THREE.Group();
    g.add(pyramid(s * 0.98, s * 0.42, std('#efe9dc', { roughness: 0.35 }), 0));
    const gd = gold();
    g.add(cyl(s * 0.3, s * 0.34, s * 0.06, gd, s * 0.42));
    g.add(cyl(s * 0.16, s * 0.24, s * 0.14, gd, s * 0.48));
    const fl = new THREE.Group(); fl.position.y = s * 0.62; g.add(fl);
    fl.add(tongue(s * 0.2, s * 0.85, 0.12, gd));
    const l = tongue(s * 0.13, s * 0.55, -0.22, gd, 8); l.position.x = -s * 0.09; fl.add(l);
    const rr = tongue(s * 0.12, s * 0.48, 0.25, gd, 8); rr.position.x = s * 0.1; fl.add(rr);
    g.userData.tick = (t) => fl.scale.set(1 + 0.03 * Math.sin(t * 7), 1 + 0.05 * Math.sin(t * 9.3), 1);
    return [g, s * 1.5];
  },
  belfry(s, look, o) {
    const g = new THREE.Group();
    const R = s * 0.42, h = s * 0.42;
    const facade = look.cylinderMaterial ? look.cylinderMaterial(Math.max(2, Math.round(2 * Math.PI * R))) : std('#efe3c8');
    g.add(mesh(new THREE.CylinderGeometry(R, R, h, 32, 1, true), facade, h / 2));
    const cream = std(o.trim || '#efe6d2', { roughness: 0.65 });
    g.add(cyl(R * 1.1, R * 1.1, s * 0.05, cream, h));
    g.add(cyl(R * 0.5, R * 0.62, s * 0.08, std('#b9ab90'), h + s * 0.05));
    g.add(cyl(s * 0.04, s * 0.09, s * 0.12, metal('#c7953c', 0.35), h * 0.4));
    return [g, h + s * 0.16];
  },
  spire(s, look, o) {
    const g = new THREE.Group();
    let y = 0;
    const tiers = o.tiers || [0.8, 0.62, 0.46, 0.3];
    tiers.forEach((k, n) => { g.add(mesh(look.geometry({ x: 0, z: 0, w: s * k, d: s * k }, n + 1), look.materials(n + 1), y + H / 2)); y += H; });
    const needleH = s * (o.needle || 1.7);
    const steel = metal('#dfe5ea', 0.25);
    g.add(cyl(s * 0.1, s * 0.14, s * 0.15, steel, y, 8));
    g.add(cyl(s * 0.012, s * 0.06, needleH, steel, y, 8));
    const lamp = glow('#ff3a3a', 3); g.add(mesh(new THREE.SphereGeometry(s * 0.035, 10, 8), lamp, y + needleH));
    g.userData.tick = (t) => { lamp.emissiveIntensity = Math.sin(t * 4) > 0 ? 3 : 0.1; };
    return [g, y + needleH];
  },
  pyramidion(s, look, o) {
    const g = new THREE.Group();
    g.add(pyramid(s * 0.98, s * 0.55, mat(o.color, 'gold'), 0));
    return [g, s * 0.55];
  },
  dome(s, look, o) {
    const g = new THREE.Group();
    const drum = mat(o.drum || 'white');
    g.add(cyl(s * 0.4, s * 0.42, s * 0.22, drum, 0, 32));
    const dm = mat(o.color || 'gold');
    const geo = new THREE.SphereGeometry(s * 0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    if (o.onion) { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / (s * 0.4); p.setX(k, p.getX(k) * (1 + 0.25 * Math.sin(yy * Math.PI))); p.setZ(k, p.getZ(k) * (1 + 0.25 * Math.sin(yy * Math.PI))); p.setY(k, p.getY(k) * 1.5); } geo.computeVertexNormals(); }
    g.add(mesh(geo, dm, s * 0.22));
    const top = finial(g, s * (o.onion ? 0.82 : 0.62), s, gold());
    return [g, top];
  },
  minaret(s, look, o) {
    const g = new THREE.Group();
    const w = mat(o.body || 'white'), trim = mat(o.trim || 'stone');
    g.add(cyl(s * 0.52, s * 0.4, s * 0.1, trim, 0, 24));            // balkon
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const p = cyl(s * 0.012, s * 0.012, s * 0.1, trim, s * 0.1, 6); p.position.x = Math.cos(a) * s * 0.5; p.position.z = Math.sin(a) * s * 0.5; g.add(p); }
    g.add(cyl(s * 0.5, s * 0.5, s * 0.02, trim, s * 0.2));
    if (o.balls) { // lentera kotak + tiga bola tembaga
      g.add(box(s * 0.45, s * 0.4, s * 0.45, w, s * 0.1));
      g.add(pyramid(s * 0.5, s * 0.2, mat('green'), s * 0.5));
      let y = s * 0.7; [0.09, 0.075, 0.06].forEach((rr) => { g.add(mesh(new THREE.SphereGeometry(s * rr, 14, 10), gold(), y + s * rr)); y += s * rr * 2; });
      return [g, y + s * 0.05];
    }
    g.add(cyl(s * 0.27, s * 0.3, s * 0.6, w, s * 0.1, 24));
    g.add(cyl(s * 0.35, s * 0.32, s * 0.06, trim, s * 0.7, 24));
    g.add(mesh(new THREE.ConeGeometry(s * 0.3, s * 0.55, 24), mat(o.cap || 'gold'), s * 0.76 + s * 0.275));
    const top = finial(g, s * 1.31, s, gold());
    return [g, top];
  },
  clock(s, look, o) {
    const g = new THREE.Group();
    const body = mat(o.body || 'stone');
    const bh = s * 0.75;
    g.add(box(s * 0.92, bh, s * 0.92, body, 0));
    const face = std('#f5f1e6', { roughness: 0.4, emissive: '#fff0c8', emissiveIntensity: o.lit ? 0.8 : 0.05 });
    const hand = std('#1c1c1f');
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, cx = Math.sin(a), cz = Math.cos(a);
      const f = mesh(new THREE.CircleGeometry(s * 0.3, 32), face, bh * 0.52);
      f.position.x = cx * s * 0.462; f.position.z = cz * s * 0.462; f.rotation.y = a; g.add(f);
      const rim = mesh(new THREE.TorusGeometry(s * 0.3, s * 0.025, 8, 32), gold(), bh * 0.52);
      rim.position.copy(f.position); rim.rotation.y = a; g.add(rim);
      for (const [len, ang] of [[0.22, 0.6], [0.15, 2.4]]) {
        const hnd = mesh(new THREE.BoxGeometry(s * 0.025, s * len, s * 0.01), hand, 0);
        hnd.geometry.translate(0, s * len / 2, 0);
        hnd.position.set(cx * s * 0.47, bh * 0.52, cz * s * 0.47); hnd.rotation.set(0, a, ang); g.add(hnd);
      }
    }
    g.add(box(s * 1.0, s * 0.06, s * 1.0, mat(o.trim || 'white'), bh));
    let y = bh + s * 0.06;
    const roof = mat(o.roofColor || 'slate');
    if (o.roof === 'gonjong') { // atap bergonjong (tanduk melengkung) gaya Minang
      g.add(pyramid(s * 1.05, s * 0.35, roof, y));
      for (let k = 0; k < 4; k++) {
        const horn = tongue(s * 0.12, s * 0.62, 0.55, roof, 8);
        const holder = new THREE.Group(); holder.rotation.y = (k * Math.PI) / 2; holder.position.y = y + s * 0.05;
        horn.position.x = s * 0.05; horn.rotation.z = -0.15; holder.add(horn); g.add(holder);
      }
      g.add(mesh(new THREE.ConeGeometry(s * 0.08, s * 0.5, 8), roof, y + s * 0.5));
      y += s * 0.75;
    } else if (o.roof === 'spire') {
      g.add(pyramid(s * 0.95, s * 1.1, roof, y)); y += s * 1.1;
      y = finial(g, y, s, gold());
    } else if (o.roof === 'dome') {
      g.add(mesh(new THREE.SphereGeometry(s * 0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), roof, y)); y += s * 0.42;
      y = finial(g, y, s, gold());
    } else if (o.roof === 'star') { // menara benteng: limas tinggi + bintang merah
      g.add(pyramid(s * 0.8, s * 1.0, mat('green'), y)); y += s * 1.0;
      const star = mesh(new THREE.OctahedronGeometry(s * 0.12, 0), glow('#d4202a', 1.5), y + s * 0.12); g.add(star); y += s * 0.24;
    } else { g.add(pyramid(s * 1.0, s * 0.45, roof, y)); y += s * 0.45; y = finial(g, y, s, gold()); }
    return [g, y];
  },
  pagoda(s, look, o) {
    const g = new THREE.Group();
    const roof = mat(o.roofColor || 'slate'), wall = std(o.wall || '#a3312a');
    let y = 0;
    [1.0, 0.82, 0.64].forEach((k) => {
      g.add(box(s * k * 0.62, s * 0.2, s * k * 0.62, wall, y)); y += s * 0.2;
      const e = mesh(new THREE.CylinderGeometry(s * k * 0.3, s * k * 0.8, s * 0.12, 4), roof, y + s * 0.06); e.rotation.y = Math.PI / 4; g.add(e); y += s * 0.12;
    });
    const gd = gold();
    g.add(cyl(s * 0.04, s * 0.05, s * 0.7, gd, y, 8));
    for (let k = 0; k < 6; k++) { const ring = mesh(new THREE.TorusGeometry(s * 0.07, s * 0.012, 6, 16), gd, y + s * 0.15 + k * s * 0.07); ring.rotation.x = Math.PI / 2; g.add(ring); }
    g.add(mesh(new THREE.SphereGeometry(s * 0.06, 10, 8), gd, y + s * 0.75));
    return [g, y + s * 0.8];
  },
  lantern(s, look, o) {
    const g = new THREE.Group();
    const iron = mat(o.cap || 'black');
    g.add(cyl(s * 0.52, s * 0.48, s * 0.06, iron, 0, 32));
    const rail = mesh(new THREE.TorusGeometry(s * 0.5, s * 0.012, 6, 40), iron, s * 0.16); rail.rotation.x = Math.PI / 2; g.add(rail);
    const lampGlass = std('#fff3c4', { emissive: '#ffd36b', emissiveIntensity: 2.2, roughness: 0.1, transparent: true, opacity: 0.9 });
    g.add(cyl(s * 0.3, s * 0.3, s * 0.36, lampGlass, s * 0.06, 16));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const p = cyl(s * 0.01, s * 0.01, s * 0.36, iron, s * 0.06, 6); p.position.x = Math.cos(a) * s * 0.3; p.position.z = Math.sin(a) * s * 0.3; g.add(p); }
    g.add(mesh(new THREE.SphereGeometry(s * 0.33, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), iron, s * 0.42));
    const top = finial(g, s * 0.74, s, iron);
    g.userData.tick = (t) => { lampGlass.emissiveIntensity = 1.6 + Math.max(0, Math.sin(t * 2)) * 2; };
    return [g, top];
  },
  antenna(s, look, o) {
    const g = new THREE.Group();
    const c = mat(o.body || 'white');
    let y = 0;
    g.add(cyl(s * 0.2, s * 0.26, s * 0.4, c, 0, 24)); y = s * 0.4;
    const pod = o.pod || 'disc';
    if (pod === 'ball') {
      const r = s * 0.55;
      const bm = mat(o.podColor || 'steel', 'steel');
      g.add(mesh(new THREE.SphereGeometry(r, 32, 20), bm, y + r)); y += r * 2;
      if (o.ring) { const rg = mesh(new THREE.TorusGeometry(r * 1.02, s * 0.03, 8, 40), glow('#ffd27a', 0.8), y - r); rg.rotation.x = Math.PI / 2; g.add(rg); }
    } else if (pod === 'saucer') {
      g.add(cyl(s * 0.9, s * 0.35, s * 0.25, c, y, 40)); y += s * 0.25;
      g.add(cyl(s * 0.6, s * 0.9, s * 0.08, glow('#ffe7b0', 0.6), y, 40)); y += s * 0.08;
    } else {
      g.add(cyl(s * 0.65, s * 0.45, s * 0.32, c, y, 40)); y += s * 0.32;
      g.add(cyl(s * 0.6, s * 0.6, s * 0.06, glow('#ffe7b0', 0.7), y, 40)); y += s * 0.06;
      g.add(cyl(s * 0.4, s * 0.62, s * 0.18, c, y, 40)); y += s * 0.18;
    }
    const mastH = s * (o.mast || 2.0);
    g.add(cyl(s * 0.03, s * 0.09, mastH, mat('steel'), y, 8));
    const lamp = glow('#ff3a3a', 3);
    [0.33, 0.66, 1].forEach((k) => g.add(mesh(new THREE.SphereGeometry(s * 0.03, 8, 6), lamp, y + mastH * k)));
    g.userData.tick = (t) => { lamp.emissiveIntensity = Math.sin(t * 3) > 0 ? 3 : 0.2; };
    return [g, y + mastH];
  },
  deco(s, look, o) {
    const g = new THREE.Group();
    const m = mat(o.color || 'stone');
    let y = 0;
    if (o.sunburst) { // mahkota baja berlengkung bertingkat
      const st = metal('#e6eaee', 0.2);
      [0.85, 0.7, 0.55, 0.4, 0.27].forEach((k) => {
        const h = s * 0.22;
        const tier = cyl(s * k * 0.5, s * k * 0.5 + s * 0.06, h, st, y, 4); tier.rotation.y = Math.PI / 4; g.add(tier);
        for (let q = 0; q < 4; q++) { // jendela segitiga menyala
          const a = (q * Math.PI) / 2, tri = mesh(new THREE.CircleGeometry(s * k * 0.12, 3), glow('#fff2c4', 1.2), y + h * 0.5);
          tri.position.x = Math.sin(a) * s * k * 0.37; tri.position.z = Math.cos(a) * s * k * 0.37; tri.rotation.set(0, a, Math.PI / 2); g.add(tri);
        }
        y += h;
      });
      g.add(cyl(0, s * 0.08, s * 0.9, st, y, 8)); y += s * 0.9;
      return [g, y];
    }
    [0.8, 0.62, 0.45].forEach((k) => { g.add(box(s * k, s * 0.25, s * k, m, y)); y += s * 0.25; });
    g.add(cyl(s * 0.12, s * 0.16, s * 0.3, metal('#c9cfd4'), y, 12)); y += s * 0.3;
    g.add(cyl(s * 0.015, s * 0.05, s * (o.mast || 1.4), mat('steel'), y, 8)); y += s * (o.mast || 1.4);
    return [g, y];
  },
  gothic(s, look, o) {
    const g = new THREE.Group();
    const st = mat(o.color || 'stone');
    g.add(box(s * 0.9, s * 0.18, s * 0.9, st, 0));
    for (let k = 0; k < 4; k++) { // menara-menara kecil di sudut
      const a = Math.PI / 4 + (k * Math.PI) / 2, p = mesh(new THREE.ConeGeometry(s * 0.07, s * 0.55, 8), st, s * 0.18 + s * 0.275);
      p.position.x = Math.cos(a) * s * 0.55; p.position.z = Math.sin(a) * s * 0.55; g.add(p);
    }
    const sp = mesh(new THREE.ConeGeometry(s * 0.36, s * (o.height || 1.8), 8), mat(o.spire || o.color || 'stone'), s * 0.18 + s * (o.height || 1.8) / 2);
    g.add(sp);
    const top = finial(g, s * 0.18 + s * (o.height || 1.8), s, gold());
    return [g, top];
  },
  prang(s, look, o) {
    const g = new THREE.Group();
    const m = std(o.color || '#e9e2d3', { roughness: 0.5 });
    let y = 0, r = s * 0.48;
    for (let k = 0; k < 6; k++) {
      g.add(cyl(r * 0.85, r, s * 0.16, m, y, 12)); y += s * 0.16;
      g.add(cyl(r * 0.9, r * 0.9, s * 0.03, std(k % 2 ? '#3d7fb0' : '#c8553d'), y, 12)); y += s * 0.03;
      r *= 0.8;
    }
    g.add(cyl(0, r, s * 0.6, gold(), y, 10)); y += s * 0.6;
    return [g, y];
  },
  lotus(s, look, o) {
    const g = new THREE.Group();
    const pm = std(o.color || '#d99ab5', { roughness: 0.45 });
    g.add(cyl(s * 0.3, s * 0.25, s * 0.2, pm, 0, 24));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, petal = tongue(s * 0.12, s * 0.6, 0.35, pm, 8);
      const h = new THREE.Group(); h.rotation.y = a; h.position.y = s * 0.15; petal.position.x = s * 0.15; h.add(petal); g.add(h);
    }
    g.add(cyl(s * 0.02, s * 0.06, s * 1.2, mat('steel'), s * 0.2, 8));
    return [g, s * 1.4];
  },
  helipad(s, look, o) {
    const g = new THREE.Group();
    g.add(box(s * 0.95, s * 0.12, s * 0.95, std('#5c6166'), 0));
    const pad = mesh(new THREE.CylinderGeometry(s * 0.36, s * 0.36, s * 0.02, 32), std('#2f3337'), s * 0.13); g.add(pad);
    const hm = std('#f3f0e8');
    g.add(box(s * 0.04, s * 0.01, s * 0.24, hm, s * 0.15).translateX(-s * 0.08));
    g.add(box(s * 0.04, s * 0.01, s * 0.24, hm, s * 0.15).translateX(s * 0.08));
    g.add(box(s * 0.16, s * 0.01, s * 0.04, hm, s * 0.15));
    const mast = cyl(s * 0.01, s * 0.02, s * 0.8, mat('steel'), s * 0.12, 6); mast.position.x = s * 0.38; mast.position.z = s * 0.38; g.add(mast);
    return [g, s * 0.92];
  },
  shard(s, look, o) {
    const g = new THREE.Group();
    const gl = look.sideMaterial || std('#9fb7c9', { metalness: 0.6, roughness: 0.1 });
    [[0.3, 0.3, 1.5], [-0.28, 0.25, 1.25], [0.25, -0.3, 1.1], [-0.25, -0.25, 1.35]].forEach(([x, z, h]) => {
      const p = mesh(new THREE.CylinderGeometry(0, s * 0.35, s * h, 4), gl, s * h / 2);
      p.position.x = x * s; p.position.z = z * s; p.rotation.y = Math.PI / 4; g.add(p);
    });
    return [g, s * 1.5];
  },
  tank(s, look, o) {
    const g = new THREE.Group();
    const m = mat(o.color || 'stone');
    g.add(cyl(s * 0.6, s * 0.4, s * 0.25, m, 0, 32));
    g.add(cyl(s * 0.6, s * 0.6, s * 0.5, m, s * 0.25, 32));
    g.add(mesh(new THREE.ConeGeometry(s * 0.64, s * 0.35, 32), mat(o.roofColor || 'slate'), s * 0.75 + s * 0.175));
    const top = finial(g, s * 1.1, s, gold());
    return [g, top];
  },
  windcatcher(s, look, o) {
    const g = new THREE.Group();
    const m = std(o.color || '#c79f6e', { roughness: 0.95 });
    g.add(box(s * 0.7, s * 0.7, s * 0.7, m, 0));
    const dark = std('#2b2018');
    for (let k = 0; k < 4; k++) for (let q = -1; q <= 1; q++) {
      const a = (k * Math.PI) / 2, sl = box(s * 0.08, s * 0.45, s * 0.02, dark, s * 0.15);
      sl.position.x = Math.sin(a) * s * 0.351 + Math.cos(a) * q * s * 0.18; sl.position.z = Math.cos(a) * s * 0.351 - Math.sin(a) * q * s * 0.18; sl.rotation.y = a; g.add(sl);
    }
    g.add(box(s * 0.76, s * 0.06, s * 0.76, m, s * 0.7));
    return [g, s * 0.76];
  },
  twinMast(s) {
    const g = new THREE.Group();
    g.add(box(s * 0.8, s * 0.15, s * 0.8, std('#2a2d31'), 0));
    const lamp = glow('#ff3a3a', 3);
    [-1, 1].forEach((q) => {
      const m = cyl(s * 0.03, s * 0.06, s * 1.6, mat('steel'), s * 0.15, 8); m.position.x = q * s * 0.22; g.add(m);
      const l = mesh(new THREE.SphereGeometry(s * 0.035, 8, 6), lamp, s * 1.75); l.position.x = q * s * 0.22; g.add(l);
    });
    g.userData.tick = (t) => { lamp.emissiveIntensity = Math.sin(t * 3) > 0 ? 3 : 0.2; };
    return [g, s * 1.8];
  },
  treeTop(s) {
    const g = new THREE.Group();
    g.add(box(s * 0.95, s * 0.1, s * 0.95, std('#d8d5cc'), 0));
    const leaf = std('#3f7a35', { roughness: 0.9, flatShading: true });
    [[0.25, 0.25, 0.22], [-0.25, 0.2, 0.18], [0.2, -0.25, 0.2], [-0.22, -0.22, 0.24], [0, 0, 0.26]].forEach(([x, z, r]) => {
      const t = mesh(new THREE.IcosahedronGeometry(s * r, 1), leaf, s * 0.1 + s * r); t.position.x = x * s; t.position.z = z * s; g.add(t);
    });
    return [g, s * 0.62];
  }
};

/** Buat puncak di atas blok `top` (lantai ke-`i`). */
export function buildCrown(kind, top, i, look, opts = {}) {
  const s = Math.max(0.35, Math.min(top.w, top.d));
  const [g, height] = (K[kind] || K.spire)(s, look, opts);
  g.position.set(top.x, i * H + H / 2, top.z);
  g.userData.height = height;
  return g;
}

export const CROWN_KINDS = Object.keys(K);
