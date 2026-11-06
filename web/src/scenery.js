// Lingkungan di sekitar menara: alas bangunan, tanah bertekstur, pohon, dan
// bangunan-bangunan kecil untuk memberi rasa skala. Semua prosedural.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { H } from './logic.js';
import { rng } from './textures.js';

const GROUND_R = 17;
const CLEAR_R = 5.6; // area tengah tanpa dekorasi (tempat potongan lantai jatuh)

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
function groundTexture(kind, seed) {
  return canvasTex(2048, (g, S) => {
    const r = rng(seed), k = S / (2 * GROUND_R); // px per unit
    const P = (w) => (w + GROUND_R) * k;          // dunia → piksel
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
    if (kind === 'park') {
      g.fillStyle = '#5f8f3e'; g.fillRect(0, 0, S, S);
      blotch(900, ['rgba(120,160,70,.25)', 'rgba(60,100,40,.25)', 'rgba(150,170,80,.15)'], 30);
      noise(40000, '30,60,20', 0.25, 2);
      const pave = '#d8d0c0';
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2, L = GROUND_R;
        path(0, 0, Math.cos(ang) * L, Math.sin(ang) * L, a % 2 ? 0.35 : 0.6, pave);
      }
      g.strokeStyle = pave; g.lineWidth = 0.4 * k; g.beginPath(); g.arc(P(0), P(0), 7.2 * k, 0, 7); g.stroke();
      paving(-4.6, -4.6, 4.6, 4.6, '#cfc6b4', 'rgba(90,80,65,.35)', 0.5);
      paving(-4.0, -4.0, 4.0, 4.0, '#e2dbcc', 'rgba(90,80,65,.3)', 0.33);
    } else if (kind === 'piazza') {
      g.fillStyle = '#73a843'; g.fillRect(0, 0, S, S);
      for (let i = -GROUND_R; i < GROUND_R; i += 1.2) { // jalur bekas potong rumput
        g.fillStyle = `rgba(${((i / 1.2) | 0) % 2 ? '255,255,200,.05' : '0,40,0,.06'})`;
        g.fillRect(P(i), 0, 1.2 * k, S);
      }
      noise(40000, '30,70,20', 0.22, 2);
      const marble = '#ece6d8';
      path(0, 0, -GROUND_R, -GROUND_R, 1.2, marble);
      path(0, 0, GROUND_R, -GROUND_R * 0.2, 0.7, marble);
      path(-GROUND_R, 3.5, GROUND_R, 3.5, 0.9, marble);
      g.fillStyle = marble; g.beginPath(); g.arc(P(0), P(0), 3.4 * k, 0, 7); g.fill();
      g.strokeStyle = 'rgba(120,110,90,.35)'; g.lineWidth = 2;
      for (let rr = 0.6; rr < 3.4; rr += 0.45) { g.beginPath(); g.arc(P(0), P(0), rr * k, 0, 7); g.stroke(); }
    } else { // kota gurun
      g.fillStyle = '#d7b47c'; g.fillRect(0, 0, S, S);
      blotch(700, ['rgba(230,200,150,.3)', 'rgba(180,140,90,.2)'], 40);
      noise(50000, '120,90,50', 0.2, 2);
      paving(-4.4, -4.4, 4.4, 4.4, '#e7dcc8', 'rgba(110,95,75,.35)', 0.4);
      const road = (x0, z0, x1, z1, w) => {
        path(x0, z0, x1, z1, w, '#3a3c3f');
        g.setLineDash([0.35 * k, 0.35 * k]); path(x0, z0, x1, z1, 0.05, '#f2e7c9'); g.setLineDash([]);
        path(x0, z0, x1, z1, 0.02, 'rgba(0,0,0,0)');
      };
      const R = 5.4;
      road(-R, -R, R, -R, 0.9); road(R, -R, R, R, 0.9); road(R, R, -R, R, 0.9); road(-R, R, -R, -R, 0.9);
      road(-GROUND_R, 0, -R, 0, 0.9); road(R, 0, GROUND_R, 0, 0.9); road(0, -GROUND_R, 0, -R, 0.9); road(0, R, 0, GROUND_R, 0.9);
      g.fillStyle = '#3f8fb0'; g.fillRect(P(2.3), P(2.3), 1.6 * k, 1.6 * k); // kolam air mancur
      g.strokeStyle = '#e7dcc8'; g.lineWidth = 0.12 * k; g.strokeRect(P(2.3), P(2.3), 1.6 * k, 1.6 * k);
    }
  });
}

function groundAlpha() {
  return canvasTex(256, (g, S) => {
    const gr = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }, false);
}

/* ---------- Bangunan kecil (digabung jadi satu mesh) ---------- */
function windowTexture(kind) {
  return canvasTex(256, (g, S) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
    const cols = kind === 'house' ? 3 : 4, rows = kind === 'house' ? 3 : 6, cw = S / cols, rh = S / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = cw * (kind === 'house' ? 0.34 : 0.55), h = rh * (kind === 'house' ? 0.5 : 0.55);
      const px = x * cw + (cw - w) / 2, py = y * rh + (rh - h) / 2;
      g.fillStyle = kind === 'house' ? '#3f4a3a' : '#5e7384'; g.fillRect(px, py, w, h);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px, py, w, h * 0.3);
      if (kind === 'house') { g.fillStyle = '#4e6b47'; g.fillRect(px - w * 0.35, py, w * 0.3, h); g.fillRect(px + w * 1.05, py, w * 0.3, h); }
    }
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 10, 10); // titik polos untuk atap
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
function trees(spots, r, { kind = 'round', scale = 1 } = {}) {
  const leaves = [], trunks = [];
  const leafColors = kind === 'palm' ? ['#4f7d33', '#5d8a3a'] : kind === 'cypress' ? ['#2e5a31', '#355f34'] : ['#3f7a35', '#4b8a3a', '#356b2f', '#5a8f3f'];
  spots.forEach(([x, z]) => {
    const s = scale * (0.75 + r() * 0.5), col = leafColors[(r() * leafColors.length) | 0];
    if (kind === 'cypress') {
      leaves.push(finish(new THREE.ConeGeometry(0.17 * s, 1.2 * s, 8), col, x, 0.65 * s, z));
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

/** Titik-titik acak di cincin [r0, r1], menghindari area tengah & jalur. */
function scatter(r, n, r0, r1, avoid = () => false) {
  const out = [];
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const a = r() * Math.PI * 2, d = r0 + Math.sqrt(r()) * (r1 - r0);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.max(Math.abs(x), Math.abs(z)) < CLEAR_R || avoid(x, z)) continue;
    if (out.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < 0.5)) continue;
    out.push([x, z]);
  }
  return out;
}

function cityBlocks(r, spots, palette, { minH, maxH, kind = 'office', roof = null }) {
  const bodies = [], roofs = [];
  spots.forEach(([x, z]) => {
    const w = 0.7 + r() * 0.9, d = 0.7 + r() * 0.9;
    const h = minH + Math.pow(r(), 2.2) * (maxH - minH);
    const rot = Math.round(r()) * Math.PI / 2 + (r() - 0.5) * 0.1;
    bodies.push(boxGeo(w, h, d, palette[(r() * palette.length) | 0], x, h / 2, z, rot));
    if (roof) roofs.push(gableGeo(w, d, 0.32, roof[(r() * roof.length) | 0], x, h, z, rot));
  });
  const g = new THREE.Group();
  const tex = windowTexture(kind); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const bm = mergedMesh(bodies, std('#ffffff', { vertexColors: true, map: tex, roughness: 0.8 }));
  if (bm) { bm.material.userData.ownTextures = [tex]; g.add(bm); }
  const rmesh = mergedMesh(roofs, std('#ffffff', { vertexColors: true, flatShading: true, roughness: 0.8 }));
  if (rmesh) g.add(rmesh);
  return g;
}

/* ---------- Alas khas tiap bangunan ---------- */
function plinth(kind) {
  const g = new THREE.Group();
  let h = 0;
  if (kind === 'cawan') { // pelataran berundak + "cawan" yang melebar ke atas
    const marble = std('#e9e3d5', { roughness: 0.45 });
    const step = shadowed(new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.14, 7.4), std('#cfc6b3')));
    step.position.y = -0.07 - 0.62; g.add(step);
    const step2 = shadowed(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.1, 6.6), std('#ddd5c4')));
    step2.position.y = -0.05 - 0.52; g.add(step2);
    const cup = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(5.2 / Math.SQRT2, 3.6 / Math.SQRT2, 0.42, 4), marble));
    cup.rotation.y = Math.PI / 4; cup.position.y = -0.21 - 0.1; g.add(cup);
    const rim = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.1, 5.3), marble));
    rim.position.y = -0.05; g.add(rim);
    h = 0.76;
  } else if (kind === 'round') { // undakan bundar dari marmer
    const m = std('#e8e1d0', { roughness: 0.55 });
    const c1 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.1, 48), m));
    c1.position.y = -0.05; g.add(c1);
    const c2 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.12, 48), m));
    c2.position.y = -0.16; g.add(c2);
    h = 0.22;
  } else { // podium pencakar langit
    const pod = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.42, 5.4), std('#c9c1b2', { roughness: 0.6 })));
    pod.position.y = -0.21; g.add(pod);
    const band = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5.46, 0.16, 5.46), std('#2d3a44', { metalness: 0.8, roughness: 0.2 })));
    band.position.y = -0.24; g.add(band);
    h = 0.42;
  }
  g.position.y = -H / 2;
  return { group: g, height: h };
}

/* ---------- Penanda lokasi ---------- */
function cathedral(x, z, rot) {
  const parts = [];
  const white = '#ece6d8', roof = '#9a8f80';
  parts.push(boxGeo(1.7, 1.25, 5.2, white, 0, 0.625, 0));
  parts.push(gableGeo(1.7, 5.2, 0.55, roof, 0, 1.25, 0, 0));
  parts.push(boxGeo(1.0, 0.85, 5.6, white, -1.3, 0.425, 0)); parts.push(boxGeo(1.0, 0.85, 5.6, white, 1.3, 0.425, 0));
  parts.push(boxGeo(4.2, 1.1, 1.3, white, 0, 0.55, 1.0));
  parts.push(gableGeo(1.3, 4.2, 0.45, roof, 0, 1.1, 1.0, Math.PI / 2));
  const dome = new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  parts.push(finish(dome, '#b8ad9a', 0, 1.35, 1.0));
  parts.forEach((p) => { p.rotateY(rot); p.translate(x, 0, z); });
  const tex = windowTexture('house'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const m = mergedMesh(parts, std('#ffffff', { vertexColors: true, map: tex, roughness: 0.6 }));
  m.material.userData.ownTextures = [tex];
  const g = new THREE.Group(); g.add(m);
  // baptisteri bundar
  const bap = [finish(new THREE.CylinderGeometry(1.0, 1.0, 1.1, 32), white, 0, 0.55, 0),
    finish(new THREE.CylinderGeometry(0.62, 1.05, 0.5, 32), roof, 0, 1.35, 0),
    finish(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), roof, 0, 1.55, 0)];
  bap.forEach((p) => p.translate(x + 5.2, 0, z - 3.2));
  g.add(mergedMesh(bap, std('#ffffff', { vertexColors: true, roughness: 0.6 })));
  return g;
}

/**
 * Bangun lingkungan untuk satu bangunan. Mengembalikan Group (sudah diposisikan;
 * puncak alas berada di y = -H/2, tepat di bawah lantai dasar).
 */
export function buildScenery(b) {
  const root = new THREE.Group();
  if (b.style === 'cake') {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.3, 0.22, 48), std('#fdfaf3', { roughness: 0.4 }));
    plate.position.y = -H / 2 - 0.11; shadowed(plate, false); root.add(plate);
    return root;
  }
  const r = rng(b.id.length * 97 + 13);
  const base = plinth(b.plinth);
  root.add(base.group);
  const gy = -H / 2 - base.height;

  const tex = groundTexture(b.scenery, b.id.length * 31);
  const alpha = groundAlpha();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(GROUND_R, 96),
    std('#ffffff', { map: tex, alphaMap: alpha, transparent: true, roughness: 0.95 }));
  ground.material.userData.ownTextures = [tex, alpha];
  ground.rotation.x = -Math.PI / 2; ground.position.y = gy; ground.receiveShadow = true; ground.renderOrder = -1;
  root.add(ground);

  const deco = new THREE.Group(); deco.position.y = gy; root.add(deco);
  const onDiag = (x, z, w) => Math.abs(Math.abs(x) - Math.abs(z)) < w || Math.abs(x) < w || Math.abs(z) < w;
  if (b.scenery === 'park') {
    deco.add(trees(scatter(r, 90, 6, 10.5, (x, z) => onDiag(x, z, 0.6) || Math.abs(Math.hypot(x, z) - 7.2) < 0.4), r));
    const spots = scatter(r, 70, 11, 14.5);
    deco.add(cityBlocks(r, spots, ['#e6e1d6', '#d9d4ca', '#c9c4b8', '#f0e6d2', '#bfc8cf', '#d8c3a5'], { minH: 0.4, maxH: 3.2 }));
  } else if (b.scenery === 'piazza') {
    deco.add(cathedral(-7.2, -6.6, Math.PI / 4));
    deco.add(trees(scatter(r, 22, 6, 11, (x, z) => x < -2 && z < -2), r, { kind: 'cypress' }));
    const spots = scatter(r, 80, 11.2, 15);
    deco.add(cityBlocks(r, spots, ['#e8c9a0', '#dcb48a', '#f0dcb8', '#d9a77a', '#e6d2b0'], { minH: 0.35, maxH: 0.9, kind: 'house', roof: ['#b5552f', '#a54a2a', '#c0643a'] }));
  } else {
    const nearRoad = (x, z) => Math.abs(Math.max(Math.abs(x), Math.abs(z)) - 5.4) < 0.7 || Math.abs(x) < 0.7 || Math.abs(z) < 0.7;
    deco.add(trees(scatter(r, 26, 4.6, 8.5, nearRoad), r, { kind: 'palm' }));
    const spots = scatter(r, 60, 6.6, 14, nearRoad);
    deco.add(cityBlocks(r, spots, ['#e2cfa9', '#d4bd94', '#eadcc0', '#c9b28a', '#9fb3bf', '#7f97a6'], { minH: 0.3, maxH: 4.5 }));
  }
  return root;
}

/** Lingkungan pantulan (langit sederhana) untuk material PBR. */
export function makeEnvironment(renderer, b) {
  const pm = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(50, 48, 24);
  const top = new THREE.Color(b.sky[0]), mid = new THREE.Color(b.sky[1]), hor = new THREE.Color(b.sky[2]);
  const gnd = new THREE.Color(b.groundColor || '#6b6b60');
  const p = geo.attributes.position, cols = [], c = new THREE.Color();
  for (let k = 0; k < p.count; k++) {
    const t = p.getY(k) / 50;
    if (t >= 0) { c.copy(hor).lerp(mid, Math.min(1, t * 2.2)); if (t > 0.45) c.lerp(top, (t - 0.45) / 0.55); }
    else c.copy(hor).lerp(gnd, Math.min(0.4, -t * 3));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sunCol = new THREE.Color(b.sun.color).multiplyScalar(30);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 8), new THREE.MeshBasicMaterial({ color: sunCol }));
  sun.position.set(...b.sun.dir).normalize().multiplyScalar(40);
  scene.add(sun);
  const rt = pm.fromScene(scene, 0.02);
  pm.dispose();
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}
