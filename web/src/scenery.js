// Lingkungan di sekitar menara: alas bangunan, tanah bertekstur, air, pohon,
// bangunan sekitar & kota jauh sampai cakrawala, langit, dan peta pantulan.
// Semua prosedural.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { H } from './logic.js';
import { rng } from './textures.js';

const GROUND_R = 17;
const CLEAR_R = 5.6;  // area tengah tanpa dekorasi (tempat potongan lantai jatuh)
const SHORE = 5.2;    // pelabuhan: x > SHORE adalah laut

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const shadowed = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };

function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- Tanah ---------- */
function groundTexture(kind, seed, snow, size = 2048) {
  return canvasTex(size, (g, S) => {
    const r = rng(seed), k = S / (2 * GROUND_R);
    const P = (w) => (w + GROUND_R) * k;
    const noise = (n, rgb, a, sz) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rgb},${a * r()})`; g.fillRect(r() * S, r() * S, sz, sz); } };
    const blotch = (n, colors, rad) => { for (let i = 0; i < n; i++) { g.fillStyle = colors[(r() * colors.length) | 0]; g.beginPath(); g.arc(r() * S, r() * S, rad * (0.4 + r()), 0, 7); g.fill(); } };
    const paving = (x0, z0, x1, z1, base, joint, tile) => {
      g.fillStyle = base; g.fillRect(P(x0), P(z0), P(x1) - P(x0), P(z1) - P(z0));
      g.strokeStyle = joint; g.lineWidth = 1;
      for (let x = x0; x <= x1; x += tile) { g.beginPath(); g.moveTo(P(x), P(z0)); g.lineTo(P(x), P(z1)); g.stroke(); }
      for (let z = z0; z <= z1; z += tile) { g.beginPath(); g.moveTo(P(x0), P(z)); g.lineTo(P(x1), P(z)); g.stroke(); }
    };
    const path = (x0, z0, x1, z1, w, color) => {
      g.strokeStyle = color; g.lineWidth = w * k; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(P(x0), P(z0)); g.lineTo(P(x1), P(z1)); g.stroke();
    };
    const road = (x0, z0, x1, z1, w) => {
      path(x0, z0, x1, z1, w + 0.3, '#b9b4aa');
      path(x0, z0, x1, z1, w, '#3a3c3f');
      g.setLineDash([0.35 * k, 0.35 * k]); path(x0, z0, x1, z1, 0.05, '#f2e7c9'); g.setLineDash([]);
    };
    const grass = (base) => {
      g.fillStyle = base; g.fillRect(0, 0, S, S);
      blotch(900, ['rgba(120,160,70,.22)', 'rgba(60,100,40,.22)', 'rgba(150,170,80,.12)'], 30);
      noise(40000, '30,60,20', 0.25, 2);
    };
    if (kind === 'park') {
      grass('#5f8f3e');
      const pave = '#d8d0c0';
      for (let a = 0; a < 8; a++) { const ang = (a / 8) * Math.PI * 2; path(0, 0, Math.cos(ang) * GROUND_R, Math.sin(ang) * GROUND_R, a % 2 ? 0.35 : 0.6, pave); }
      g.strokeStyle = pave; g.lineWidth = 0.4 * k; g.beginPath(); g.arc(P(0), P(0), 7.2 * k, 0, 7); g.stroke();
      paving(-4.6, -4.6, 4.6, 4.6, '#cfc6b4', 'rgba(90,80,65,.35)', 0.5);
      paving(-4.0, -4.0, 4.0, 4.0, '#e2dbcc', 'rgba(90,80,65,.3)', 0.33);
    } else if (kind === 'piazza') {
      g.fillStyle = '#73a843'; g.fillRect(0, 0, S, S);
      for (let i = -GROUND_R; i < GROUND_R; i += 1.2) { g.fillStyle = `rgba(${((i / 1.2) | 0) % 2 ? '255,255,200,.05' : '0,40,0,.06'})`; g.fillRect(P(i), 0, 1.2 * k, S); }
      noise(40000, '30,70,20', 0.22, 2);
      const marble = '#ece6d8';
      path(0, 0, -GROUND_R, -GROUND_R, 1.2, marble); path(0, 0, GROUND_R, -GROUND_R * 0.2, 0.7, marble); path(-GROUND_R, 3.5, GROUND_R, 3.5, 0.9, marble);
      g.fillStyle = marble; g.beginPath(); g.arc(P(0), P(0), 3.4 * k, 0, 7); g.fill();
    } else if (kind === 'desert') {
      g.fillStyle = '#d7b47c'; g.fillRect(0, 0, S, S);
      blotch(700, ['rgba(230,200,150,.3)', 'rgba(180,140,90,.2)'], 40);
      noise(50000, '120,90,50', 0.2, 2);
      paving(-4.4, -4.4, 4.4, 4.4, '#e7dcc8', 'rgba(110,95,75,.35)', 0.4);
      const R = 5.4;
      road(-R, -R, R, -R, 0.9); road(R, -R, R, R, 0.9); road(R, R, -R, R, 0.9); road(-R, R, -R, -R, 0.9);
      road(-GROUND_R, 0, -R, 0, 0.9); road(R, 0, GROUND_R, 0, 0.9); road(0, -GROUND_R, 0, -R, 0.9); road(0, R, 0, GROUND_R, 0.9);
      g.fillStyle = '#3f8fb0'; g.fillRect(P(2.3), P(2.3), 1.6 * k, 1.6 * k);
    } else if (kind === 'downtown') {
      g.fillStyle = '#8d8f91'; g.fillRect(0, 0, S, S);
      noise(50000, '40,40,40', 0.2, 2);
      for (let x = -15; x <= 15; x += 5.4) road(x, -GROUND_R, x, GROUND_R, 0.9);
      for (let z = -15; z <= 15; z += 5.4) road(-GROUND_R, z, GROUND_R, z, 0.9);
      paving(-4.3, -4.3, 4.3, 4.3, '#d6d2ca', 'rgba(70,70,70,.3)', 0.45);
      g.fillStyle = '#5f8f3e'; for (const [x, z] of [[-3.6, 2.4], [2.4, -3.6]]) g.fillRect(P(x), P(z), 1.2 * k, 1.2 * k);
    } else if (kind === 'oldtown') {
      g.fillStyle = '#a39a8b'; g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 9) for (let x = (y / 9) % 2 ? 0 : 5; x < S; x += 10) { // batu jalan
        g.fillStyle = `rgba(${r() < 0.5 ? '70,62,52' : '200,190,170'},${0.15 + r() * 0.2})`; g.fillRect(x, y, 8, 7);
      }
      for (let a = 0; a < 6; a++) { const ang = (a / 6) * Math.PI * 2 + 0.3; path(0, 0, Math.cos(ang) * GROUND_R, Math.sin(ang) * GROUND_R, 1.0, 'rgba(120,110,95,.6)'); }
      g.fillStyle = '#c2b8a6'; g.beginPath(); g.arc(P(0), P(0), 4.6 * k, 0, 7); g.fill();
    } else if (kind === 'garden') {
      grass('#5c8d3f');
      g.fillStyle = '#d9cfb8'; g.beginPath(); g.arc(P(0), P(0), 4.2 * k, 0, 7); g.fill(); // kerikil
      g.strokeStyle = 'rgba(140,125,100,.5)'; g.lineWidth = 2;
      for (let rr = 0.4; rr < 4.2; rr += 0.25) { g.beginPath(); g.arc(P(0), P(0), rr * k, 0, 7); g.stroke(); } // garis garu
      g.fillStyle = '#3d7a8c'; g.beginPath(); g.ellipse(P(6.8), P(-4.5), 3.2 * k, 1.9 * k, 0.5, 0, 7); g.fill(); // kolam
      g.strokeStyle = '#8f8a7c'; g.lineWidth = 0.25 * k; g.stroke();
      path(-GROUND_R, 6, GROUND_R, 6, 0.6, '#cdbf9f');
    } else if (kind === 'harbor') {
      g.fillStyle = '#9d9a93'; g.fillRect(0, 0, S, S);
      noise(40000, '50,50,50', 0.2, 2);
      paving(-4.4, -4.4, 4.4, 4.4, '#d7d0c2', 'rgba(80,70,60,.3)', 0.5);
      g.fillStyle = '#2f6b86'; g.fillRect(P(SHORE), 0, S - P(SHORE), S);
      g.fillStyle = '#d0c8b8'; g.fillRect(P(SHORE) - 0.3 * k, 0, 0.3 * k, S); // dinding dermaga
    }
    if (snow) { g.fillStyle = 'rgba(245,248,252,.82)'; g.fillRect(0, 0, S, S); noise(30000, '170,180,195', 0.25, 3); }
  });
}

function groundAlpha() {
  return canvasTex(256, (g, S) => {
    const gr = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }, false);
}

/* ---------- Bangunan sekitar (digabung jadi satu mesh) ---------- */
function windowTexture(kind, emissive = false) {
  return canvasTex(256, (g, S) => {
    const r = rng(kind === 'house' ? 3 : 9);
    g.fillStyle = emissive ? '#000' : '#ffffff'; g.fillRect(0, 0, S, S);
    const cols = kind === 'house' ? 3 : 4, rows = kind === 'house' ? 3 : 6, cw = S / cols, rh = S / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = cw * (kind === 'house' ? 0.34 : 0.55), h = rh * (kind === 'house' ? 0.5 : 0.55);
      const px = x * cw + (cw - w) / 2, py = y * rh + (rh - h) / 2;
      if (emissive) { if (r() < 0.28) { g.fillStyle = `hsl(${32 + r() * 16} ${55 + r() * 30}% ${30 + r() * 25}%)`; g.fillRect(px, py, w, h); } continue; }
      g.fillStyle = kind === 'house' ? '#3f4a3a' : '#5e7384'; g.fillRect(px, py, w, h);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px, py, w, h * 0.3);
      if (kind === 'house') { g.fillStyle = '#4e6b47'; g.fillRect(px - w * 0.35, py, w * 0.3, h); g.fillRect(px + w * 1.05, py, w * 0.3, h); }
    }
    if (!emissive) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 10, 10); } // titik polos untuk atap
  });
}

/** Kotak dengan UV sebanding ukurannya, warna per-vertex. */
function boxGeo(w, h, d, color, x, y, z, rotY = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv, n = geo.attributes.normal;
  for (let k = 0; k < uv.count; k++) {
    if (Math.abs(n.getY(k)) > 0.5) { uv.setXY(k, 0.01, 0.99); continue; }
    const span = Math.abs(n.getX(k)) > 0.5 ? d : w;
    uv.setXY(k, uv.getX(k) * span, uv.getY(k) * h);
  }
  return finish(geo, color, x, y, z, rotY);
}
function finish(geo, color, x, y, z, rotY = 0) {
  const c = new THREE.Color(color), cols = [];
  for (let k = 0; k < geo.attributes.position.count; k++) cols.push(c.r, c.g, c.b);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  geo.rotateY(rotY); geo.translate(x, y, z);
  return geo.index ? geo.toNonIndexed() : geo;
}
/** Atap pelana (prisma segitiga) di atas kotak w×d; bubungan sejajar sumbu z lokal. */
function gableGeo(w, d, h, color, x, y, z, rotY = 0) {
  const hw = w / 2 + 0.04, hd = d / 2 + 0.05;
  const A = [-hw, 0, -hd], B = [hw, 0, -hd], C = [0, h, -hd], D = [-hw, 0, hd], E = [hw, 0, hd], F = [0, h, hd];
  const tris = [A, C, B, D, E, F, A, D, F, A, F, C, B, C, F, B, F, E];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  geo.computeVertexNormals();
  return finish(geo, color, x, y, z, rotY);
}

function mergedMesh(geos, material) {
  if (!geos.length) return null;
  const m = new THREE.Mesh(mergeGeometries(geos), material);
  geos.forEach((g) => g.dispose());
  return shadowed(m);
}

/* ---------- Pohon ---------- */
const LEAVES = {
  round: ['#3f7a35', '#4b8a3a', '#356b2f', '#5a8f3f'], palm: ['#4f7d33', '#5d8a3a'], cypress: ['#2e5a31', '#355f34'],
  blossom: ['#f2b7c6', '#eaa3b6', '#f6cbd5', '#e48fa6'], pine: ['#24502f', '#2c5b35'], snowpine: ['#e9eef3', '#dfe7ee']
};
function trees(spots, r, { kind = 'round', scale = 1 } = {}) {
  const leaves = [], trunks = [];
  const leafColors = LEAVES[kind] || LEAVES.round;
  spots.forEach(([x, z]) => {
    const s = scale * (0.75 + r() * 0.5), col = leafColors[(r() * leafColors.length) | 0];
    if (kind === 'cypress') leaves.push(finish(new THREE.ConeGeometry(0.17 * s, 1.2 * s, 8), col, x, 0.65 * s, z));
    else if (kind === 'pine' || kind === 'snowpine') {
      trunks.push(finish(new THREE.CylinderGeometry(0.04 * s, 0.06 * s, 0.3 * s, 6), '#5a3f2a', x, 0.15 * s, z));
      [0, 1, 2].forEach((q) => leaves.push(finish(new THREE.ConeGeometry((0.36 - q * 0.09) * s, 0.5 * s, 8), col, x, (0.45 + q * 0.28) * s, z)));
    } else if (kind === 'palm') {
      trunks.push(finish(new THREE.CylinderGeometry(0.035 * s, 0.05 * s, 0.9 * s, 6), '#8a6a44', x, 0.45 * s, z));
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.ConeGeometry(0.06 * s, 0.55 * s, 4);
        frond.rotateZ(Math.PI / 2 + 0.5); frond.translate(0.25 * s, 0, 0); frond.rotateY((f / 6) * Math.PI * 2 + r());
        leaves.push(finish(frond, col, x, 0.9 * s, z));
      }
    } else {
      trunks.push(finish(new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.4 * s, 6), '#6b4a2e', x, 0.2 * s, z));
      const crown = new THREE.IcosahedronGeometry(0.36 * s, 1);
      crown.scale(1, 0.85 + r() * 0.3, 1);
      leaves.push(finish(crown, col, x, 0.58 * s, z));
    }
  });
  const g = new THREE.Group();
  const lm = mergedMesh(leaves, std('#ffffff', { vertexColors: true, flatShading: true, roughness: 0.9 }));
  const tm = mergedMesh(trunks, std('#ffffff', { vertexColors: true, roughness: 0.95 }));
  if (lm) g.add(lm); if (tm) g.add(tm);
  return g;
}

/** Titik-titik acak di cincin [r0, r1], menghindari area tengah & `avoid`. */
function scatter(r, n, r0, r1, avoid = () => false, gap = 0.5) {
  const out = [];
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const a = r() * Math.PI * 2, d = r0 + Math.sqrt(r()) * (r1 - r0);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.max(Math.abs(x), Math.abs(z)) < CLEAR_R || avoid(x, z)) continue;
    if (out.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < gap)) continue;
    out.push([x, z]);
  }
  return out;
}

function cityBlocks(r, spots, palette, { minH, maxH, kind = 'office', roof = null, size = 1, glow = 0 }) {
  const bodies = [], roofs = [];
  spots.forEach(([x, z]) => {
    const w = (0.7 + r() * 0.9) * size, d = (0.7 + r() * 0.9) * size;
    // Batasi tinggi menurut jarak dari menara: selalu di bawah garis pandang kamera
    // (kamera menunduk ±15°), jadi kamera tidak pernah "masuk" ke dalam gedung.
    // Garis terburuk: dari kamera (≥20 unit, menunduk 15°) ke kaki menara naik ±0,18 per unit.
    const cap = Math.max(0.35, -1 + 0.18 * Math.hypot(x, z));
    const h = Math.min(cap, minH + Math.pow(r(), 2.2) * (maxH - minH));
    const rot = Math.round(r()) * Math.PI / 2 + (r() - 0.5) * 0.1;
    bodies.push(boxGeo(w, h, d, palette[(r() * palette.length) | 0], x, h / 2, z, rot));
    if (roof) roofs.push(gableGeo(w, d, 0.32 * Math.min(1.5, size), roof[(r() * roof.length) | 0], x, h, z, rot));
  });
  const g = new THREE.Group();
  const tex = windowTexture(kind); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const own = [tex];
  const props = { vertexColors: true, map: tex, roughness: 0.8 };
  if (glow > 0) { const e = windowTexture(kind, true); e.wrapS = e.wrapT = THREE.RepeatWrapping; own.push(e); Object.assign(props, { emissiveMap: e, emissive: '#ffffff', emissiveIntensity: glow }); }
  const bm = mergedMesh(bodies, std('#ffffff', props));
  if (bm) { bm.material.userData.ownTextures = own; g.add(bm); }
  const rmesh = mergedMesh(roofs, std('#ffffff', { vertexColors: true, flatShading: true, roughness: 0.8 }));
  if (rmesh) g.add(rmesh);
  return g;
}

/* ---------- Alas khas tiap bangunan ---------- */
function plinth(kind) {
  const g = new THREE.Group();
  const add = (geo, m, y, rotY = 0) => { const x = shadowed(new THREE.Mesh(geo, m)); x.position.y = y; x.rotation.y = rotY; g.add(x); };
  let h = 0.16;
  if (kind === 'cawan') { // pelataran berundak + "cawan" yang melebar ke atas
    const marble = std('#e9e3d5', { roughness: 0.45 });
    add(new THREE.BoxGeometry(7.4, 0.14, 7.4), std('#cfc6b3'), -0.69);
    add(new THREE.BoxGeometry(6.6, 0.1, 6.6), std('#ddd5c4'), -0.57);
    add(new THREE.CylinderGeometry(5.2 / Math.SQRT2, 3.6 / Math.SQRT2, 0.42, 4), marble, -0.31, Math.PI / 4);
    add(new THREE.BoxGeometry(5.3, 0.1, 5.3), marble, -0.05);
    h = 0.76;
  } else if (kind === 'round') {
    const m = std('#e8e1d0', { roughness: 0.55 });
    add(new THREE.CylinderGeometry(2.45, 2.45, 0.1, 48), m, -0.05);
    add(new THREE.CylinderGeometry(2.75, 2.75, 0.12, 48), m, -0.16);
    h = 0.22;
  } else if (kind === 'podium') {
    add(new THREE.BoxGeometry(5.4, 0.42, 5.4), std('#c9c1b2', { roughness: 0.6 }), -0.21);
    add(new THREE.BoxGeometry(5.46, 0.16, 5.46), std('#2d3a44', { metalness: 0.8, roughness: 0.2 }), -0.24);
    h = 0.42;
  } else if (kind === 'temple') { // undakan batu tiga tingkat
    [[5.6, 0.12], [4.9, 0.12], [4.2, 0.12]].forEach(([s, hh], q) => add(new THREE.BoxGeometry(s, hh, s), std(q % 2 ? '#bcb3a2' : '#cfc7b6'), -0.3 + q * 0.12));
    h = 0.36;
  } else if (kind === 'rock') { // batu karang (mercusuar)
    add(new THREE.CylinderGeometry(2.6, 3.4, 0.5, 9), std('#6f6a63', { roughness: 1, flatShading: true }), -0.25);
    h = 0.5;
  } else { // undakan granit sederhana
    add(new THREE.BoxGeometry(4.4, 0.16, 4.4), std('#a9a59e', { roughness: 0.7 }), -0.08);
  }
  g.position.y = -H / 2;
  return { group: g, height: h };
}

/* ---------- Penanda lokasi kecil ---------- */
function cathedral(x, z, rot) {
  const parts = [], white = '#ece6d8', roof = '#9a8f80';
  parts.push(boxGeo(1.7, 1.25, 5.2, white, 0, 0.625, 0));
  parts.push(gableGeo(1.7, 5.2, 0.55, roof, 0, 1.25, 0, 0));
  parts.push(boxGeo(1.0, 0.85, 5.6, white, -1.3, 0.425, 0)); parts.push(boxGeo(1.0, 0.85, 5.6, white, 1.3, 0.425, 0));
  parts.push(boxGeo(4.2, 1.1, 1.3, white, 0, 0.55, 1.0));
  parts.push(gableGeo(1.3, 4.2, 0.45, roof, 0, 1.1, 1.0, Math.PI / 2));
  parts.push(finish(new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#b8ad9a', 0, 1.35, 1.0));
  parts.forEach((p) => { p.rotateY(rot); p.translate(x, 0, z); });
  const tex = windowTexture('house'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const m = mergedMesh(parts, std('#ffffff', { vertexColors: true, map: tex, roughness: 0.6 }));
  m.material.userData.ownTextures = [tex];
  return m;
}
function boats(r, n) {
  const parts = [];
  for (let k = 0; k < n; k++) {
    const x = SHORE + 1.5 + r() * 9, z = -10 + r() * 20, rot = r() * Math.PI, L = 0.8 + r() * 1.2;
    parts.push(boxGeo(L, 0.18, L * 0.32, ['#f4f2ec', '#c8402f', '#2f5d8a'][k % 3], x, 0.05, z, rot));
    parts.push(boxGeo(L * 0.35, 0.18, L * 0.22, '#e9e6de', x, 0.23, z, rot));
  }
  return mergedMesh(parts, std('#ffffff', { vertexColors: true, roughness: 0.5 }));
}
function lanterns(spots) {
  const parts = [];
  spots.forEach(([x, z]) => {
    parts.push(boxGeo(0.12, 0.3, 0.12, '#a9a397', x, 0.15, z));
    parts.push(boxGeo(0.22, 0.12, 0.22, '#9a948a', x, 0.36, z));
    parts.push(finish(new THREE.ConeGeometry(0.2, 0.12, 4), '#8b857a', x, 0.48, z, Math.PI / 4));
  });
  return mergedMesh(parts, std('#ffffff', { vertexColors: true, roughness: 0.9 }));
}

/** Kota/permukiman jauh yang memudar ke cakrawala, memberi rasa ketinggian. */
function farRing(r, kind, glow, harbor, count = 280) {
  const spots = [];
  for (let k = 0; k < count; k++) {
    const a = r() * Math.PI * 2, d = 17 + Math.pow(r(), 0.7) * 80;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (harbor && x > SHORE - 1) continue;
    spots.push([x, z]);
  }
  const houses = { kind: 'house', roof: ['#b5552f', '#a54a2a', '#c0643a', '#7d4a3a'], size: 1.4, glow };
  if (kind === 'piazza' || kind === 'oldtown') return cityBlocks(r, spots, ['#e8c9a0', '#dcb48a', '#f0dcb8', '#d9a77a', '#e6e0d4'], { minH: 0.4, maxH: 1.4, ...houses });
  if (kind === 'garden') return cityBlocks(r, spots.filter(() => r() < 0.7), ['#e6e1d6', '#cfc9bd', '#bfc8cf', '#d9d0c0'], { minH: 0.4, maxH: 4, size: 1.4, glow });
  if (kind === 'desert') return cityBlocks(r, spots.filter(() => r() < 0.55), ['#e2cfa9', '#d4bd94', '#c9b28a', '#9fb3bf', '#7f97a6'], { minH: 0.4, maxH: 7, size: 1.6, glow });
  if (kind === 'downtown') return cityBlocks(r, spots, ['#c9d2d8', '#9fb0bc', '#d6d2c8', '#7f8f9a', '#b8c2c8'], { minH: 1, maxH: 14, size: 1.7, glow });
  return cityBlocks(r, spots, ['#e6e1d6', '#d9d4ca', '#c9c4b8', '#bfc8cf', '#a9b4bc'], { minH: 0.6, maxH: 8, size: 1.6, glow });
}

/**
 * Bangun lingkungan untuk satu bangunan. Puncak alas berada di y = -H/2,
 * tepat di bawah lantai dasar.
 */
export function buildScenery(b, q = { farCount: 280, groundTex: 2048 }) {
  const root = new THREE.Group();
  if (b.style === 'cake') {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.3, 0.22, 48), std('#fdfaf3', { roughness: 0.4 }));
    plate.position.y = -H / 2 - 0.11; shadowed(plate, false); root.add(plate);
    return root;
  }
  const kind = b.scenery || 'park';
  const r = rng(b.id.length * 97 + (b.index || 0) * 13 + 7);
  const base = plinth(b.plinth);
  root.add(base.group);
  const gy = -H / 2 - base.height;
  const glow = b.cityGlow || 0;
  const harbor = kind === 'harbor';

  const tex = groundTexture(kind, b.id.length * 31 + (b.index || 0), b.snow, q.groundTex);
  const alpha = groundAlpha();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(GROUND_R, 96), std('#ffffff', { map: tex, alphaMap: alpha, transparent: true, roughness: 0.95 }));
  ground.material.userData.ownTextures = [tex, alpha];
  ground.rotation.x = -Math.PI / 2; ground.position.y = gy; ground.receiveShadow = true; ground.renderOrder = -1;
  root.add(ground);
  const farCol = b.snow ? '#eef2f6' : (b.groundColor || '#7a7a6a');
  const far = new THREE.Mesh(new THREE.CircleGeometry(1200, 64), std(farCol, { roughness: 1 }));
  far.rotation.x = -Math.PI / 2; far.position.y = gy - 0.02; far.receiveShadow = true;
  root.add(far);
  if (harbor) { // laut sampai cakrawala
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), std(b.waterColor || '#2c6582', { roughness: 0.12, metalness: 0.15 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(SHORE + 1200, gy + 0.01, 0); sea.receiveShadow = true;
    root.add(sea);
  }

  const deco = new THREE.Group(); deco.position.y = gy; root.add(deco);
  const add = (o) => o && deco.add(o);
  const onDiag = (x, z, w) => Math.abs(Math.abs(x) - Math.abs(z)) < w || Math.abs(x) < w || Math.abs(z) < w;
  const treeKind = b.snow ? 'snowpine' : b.trees;
  if (kind === 'park') {
    add(trees(scatter(r, 90, 6, 10.5, (x, z) => onDiag(x, z, 0.6) || Math.abs(Math.hypot(x, z) - 7.2) < 0.4), r, { kind: treeKind || 'round' }));
    add(cityBlocks(r, scatter(r, 70, 11, 14.5), ['#e6e1d6', '#d9d4ca', '#c9c4b8', '#f0e6d2', '#bfc8cf', '#d8c3a5'], { minH: 0.4, maxH: 3.2, glow }));
  } else if (kind === 'piazza') {
    add(cathedral(-7.2, -6.6, Math.PI / 4));
    add(trees(scatter(r, 22, 6, 11, (x, z) => x < -2 && z < -2), r, { kind: treeKind || 'cypress' }));
    add(cityBlocks(r, scatter(r, 80, 11.2, 15), ['#e8c9a0', '#dcb48a', '#f0dcb8', '#d9a77a', '#e6d2b0'], { minH: 0.35, maxH: 0.9, kind: 'house', roof: ['#b5552f', '#a54a2a', '#c0643a'], glow }));
  } else if (kind === 'desert') {
    const nearRoad = (x, z) => Math.abs(Math.max(Math.abs(x), Math.abs(z)) - 5.4) < 0.7 || Math.abs(x) < 0.7 || Math.abs(z) < 0.7;
    add(trees(scatter(r, 26, 4.6, 8.5, nearRoad), r, { kind: 'palm' }));
    add(cityBlocks(r, scatter(r, 60, 6.6, 14, nearRoad), ['#e2cfa9', '#d4bd94', '#eadcc0', '#c9b28a', '#9fb3bf', '#7f97a6'], { minH: 0.3, maxH: 4.5, glow }));
  } else if (kind === 'downtown') {
    const near = (v) => { const f = (((v + 15) % 5.4) + 5.4) % 5.4; return f < 1.0 || f > 4.4; };
    const onRoad = (x, z) => near(x) || near(z);
    add(cityBlocks(r, scatter(r, 70, 6.2, 15.5, onRoad, 1.2), ['#c9d2d8', '#9fb0bc', '#d6d2c8', '#7f8f9a', '#b8c2c8', '#e0dcd2'], { minH: 1.2, maxH: 9, size: 1.1, glow }));
    add(trees(scatter(r, 20, 4.6, 6, () => false), r, { kind: treeKind || 'round', scale: 0.8 }));
  } else if (kind === 'oldtown') {
    add(cityBlocks(r, scatter(r, 120, 6, 15.5, (x, z) => onDiag(x, z, 0.5), 0.9), ['#e8c9a0', '#dcb48a', '#f0dcb8', '#d9a77a', '#e6e0d4', '#cfd6dc'], { minH: 0.5, maxH: 1.3, kind: 'house', roof: b.snow ? ['#f2f4f6', '#e6eaee'] : ['#b5552f', '#a54a2a', '#7d4a3a', '#5d6670'], glow }));
    add(trees(scatter(r, 14, 5, 8), r, { kind: treeKind || 'round', scale: 0.8 }));
  } else if (kind === 'garden') {
    const pond = (x, z) => ((x - 6.8) ** 2) / 12 + ((z + 4.5) ** 2) / 4.5 < 1.2;
    add(trees(scatter(r, 50, 5, 12, pond), r, { kind: 'blossom' }));
    add(trees(scatter(r, 30, 6, 13, pond), r, { kind: 'pine' }));
    add(lanterns(scatter(r, 8, 4.4, 5.4, () => false, 2)));
    add(cityBlocks(r, scatter(r, 40, 13, 16), ['#e6e1d6', '#cfc9bd', '#d9d0c0'], { minH: 0.4, maxH: 2.2, glow }));
  } else if (harbor) {
    add(boats(r, 9));
    add(cityBlocks(r, scatter(r, 70, 6.2, 15, (x) => x > SHORE - 1.2), ['#e8dfd0', '#d9d4ca', '#c2ccd2', '#e6c9a8', '#f2efe8'], { minH: 0.4, maxH: 2.6, kind: b.trees === 'palm' ? 'office' : 'house', roof: b.houseRoofs ? ['#b5552f', '#7d4a3a', '#5d6670'] : null, glow }));
    add(trees(scatter(r, 20, 5, 9, (x) => x > SHORE - 0.8), r, { kind: treeKind || 'round', scale: 0.8 }));
  }
  add(farRing(r, kind, glow, harbor, q.farCount));
  return root;
}

/** Kubah langit: gradasi, cahaya matahari/bulan, bintang malam, dan awan prosedural. */
export function buildSky(b) {
  const lin = (hex) => new THREE.Color(hex);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: lin(b.sky[0]) }, mid: { value: lin(b.sky[1]) }, hor: { value: lin(b.sky[2]) },
      sunCol: { value: lin(b.sun.color) }, sunDir: { value: new THREE.Vector3(...b.sun.dir).normalize() },
      cloud: { value: b.clouds ?? 0.6 }, cloudCol: { value: lin(b.cloudColor || '#ffffff') }, stars: { value: b.stars ? 1 : 0 },
      sunSize: { value: b.night ? 2500 : 900 }
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 top, mid, hor, sunCol, sunDir, cloudCol; uniform float cloud, stars, sunSize; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.07, h));
        c = mix(c, top, smoothstep(0.07, 0.45, h));
        float s = max(dot(d, sunDir), 0.0);
        c += sunCol * (pow(s, sunSize) * 6.0 + pow(s, 12.0) * 0.35);
        if (stars > 0.5 && h > 0.02) {
          vec2 q = d.xz / (h + 0.3) * 160.0; float st = hash(floor(q));
          c += vec3(1.0) * step(0.996, st) * smoothstep(0.02, 0.3, h) * 0.8;
        }
        if (h > 0.0) {
          vec2 p = d.xz / (h + 0.12) * 1.3;
          float n = fbm(p + vec2(3.1, 1.7));
          float cl = smoothstep(0.52, 0.78, n) * cloud * smoothstep(0.0, 0.12, h);
          vec3 cc = mix(cloudCol, hor, 0.25) + sunCol * pow(s, 6.0) * 0.4;
          c = mix(c, cc, cl * 0.9);
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  return dome;
}

/** Lingkungan pantulan (langit sederhana) untuk material PBR. */
export function makeEnvironment(renderer, b) {
  const pm = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(50, 48, 24);
  const top = new THREE.Color(b.sky[0]), mid = new THREE.Color(b.sky[1]), hor = new THREE.Color(b.sky[2]);
  const gnd = new THREE.Color(b.snow ? '#e8edf2' : (b.groundColor || '#6b6b60'));
  const p = geo.attributes.position, cols = [], c = new THREE.Color();
  for (let k = 0; k < p.count; k++) {
    const t = p.getY(k) / 50;
    if (t >= 0) { c.copy(hor).lerp(mid, Math.min(1, t * 2.2)); if (t > 0.45) c.lerp(top, (t - 0.45) / 0.55); }
    else c.copy(hor).lerp(gnd, Math.min(0.4, -t * 3));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sunCol = new THREE.Color(b.sun.color).multiplyScalar(b.night ? 4 : 30);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 8), new THREE.MeshBasicMaterial({ color: sunCol }));
  sun.position.set(...b.sun.dir).normalize().multiplyScalar(40);
  scene.add(sun);
  const rt = pm.fromScene(scene, 0.02);
  pm.dispose();
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
