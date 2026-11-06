// Tampilan per gaya bangunan. Semua tekstur digambar sendiri di <canvas>
// (tanpa foto/aset luar), jadi aman lisensinya.
import * as THREE from 'three';
import { H } from './logic.js';

const TW = 256;              // 1 unit dunia = 256 px
const FH = 128;              // 1 lantai (0.5 unit) = 128 px
const FLOORS_PER_TEX = 4;    // tekstur berulang tiap 4 lantai supaya tidak monoton

function rng(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function canvas() {
  const c = document.createElement('canvas');
  c.width = TW; c.height = FH * FLOORS_PER_TEX;
  return [c, c.getContext('2d')];
}
// Pita lantai ke-f (0 = paling bawah tekstur). y0 = atas pita di koordinat canvas.
const bandTop = (f) => (FLOORS_PER_TEX - 1 - f) * FH;

function drawGlass() {
  const [c, g] = canvas(); const r = rng(7);
  for (let f = 0; f < FLOORS_PER_TEX; f++) {
    const y = bandTop(f);
    const bg = g.createLinearGradient(0, y, 0, y + FH);
    bg.addColorStop(0, '#2b6a8c'); bg.addColorStop(1, '#183e58');
    g.fillStyle = bg; g.fillRect(0, y, TW, FH);
    const cols = 4, pw = TW / cols;
    for (let k = 0; k < cols; k++) {
      const x = k * pw;
      const lit = r() < 0.18;
      const pg = g.createLinearGradient(x, y, x + pw, y + FH);
      if (lit) { pg.addColorStop(0, '#ffe2a1'); pg.addColorStop(1, '#f0a85a'); }
      else { const l = 40 + r() * 18; pg.addColorStop(0, `hsl(200 55% ${l + 14}%)`); pg.addColorStop(1, `hsl(205 60% ${l - 6}%)`); }
      g.fillStyle = pg; g.fillRect(x + 4, y + 6, pw - 8, FH - 28);
      // pantulan diagonal
      g.save(); g.beginPath(); g.rect(x + 4, y + 6, pw - 8, FH - 28); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.beginPath(); g.moveTo(x + pw * 0.2, y + FH); g.lineTo(x + pw * 0.55, y); g.lineTo(x + pw * 0.75, y); g.lineTo(x + pw * 0.4, y + FH); g.fill();
      g.restore();
    }
    // spandrel (pelat lantai) di bawah pita
    g.fillStyle = '#c7d4dc'; g.fillRect(0, y + FH - 22, TW, 16);
    g.fillStyle = '#93a7b3'; g.fillRect(0, y + FH - 8, TW, 8);
    g.fillStyle = '#0d2532';
    for (let k = 0; k <= cols; k++) g.fillRect(k * pw - 2, y, 4, FH - 22);
  }
  return c;
}

function drawMarble() {
  const [c, g] = canvas(); const r = rng(11);
  for (let f = 0; f < FLOORS_PER_TEX; f++) {
    const y = bandTop(f);
    g.fillStyle = f % 2 ? '#f4efe4' : '#efe8da'; g.fillRect(0, y, TW, FH);
    for (let n = 0; n < 260; n++) {
      g.fillStyle = `rgba(120,105,80,${0.03 + r() * 0.05})`;
      g.fillRect(r() * TW, y + r() * FH, 2, 2);
    }
    g.strokeStyle = 'rgba(140,130,115,0.22)'; g.lineWidth = 1.2;
    for (let v = 0; v < 3; v++) {
      g.beginPath(); let px = r() * TW, py = y + r() * FH; g.moveTo(px, py);
      for (let s = 0; s < 4; s++) { px += (r() - 0.3) * 70; py += (r() - 0.5) * 40; g.lineTo(px, Math.max(y, Math.min(y + FH, py))); }
      g.stroke();
    }
    // sambungan panel (pola bata), garis lantai
    g.fillStyle = '#cfc5b0';
    const off = f % 2 ? 64 : 0;
    for (let x = off; x < TW + 1; x += 128) g.fillRect(x - 1, y, 2, FH);
    g.fillRect(0, y + FH - 4, TW, 4);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, y, TW, 3);
  }
  return c;
}

function drawStone() {
  const [c, g] = canvas(); const r = rng(23);
  for (let f = 0; f < FLOORS_PER_TEX; f++) {
    const y = bandTop(f);
    g.fillStyle = `hsl(40 ${42 + f * 3}% ${86 - f}%)`; g.fillRect(0, y, TW, FH);
    for (let n = 0; n < 200; n++) { g.fillStyle = `rgba(110,85,50,${0.03 + r() * 0.05})`; g.fillRect(r() * TW, y + r() * FH, 2, 2); }
    // galeri lengkung: 2 lengkung per unit
    const aw = TW / 2;
    for (let k = 0; k < 2; k++) {
      const cx = k * aw + aw / 2, w = aw - 34, top = y + 22, bot = y + FH - 26;
      const ag = g.createLinearGradient(0, top, 0, bot);
      ag.addColorStop(0, '#4a3c2d'); ag.addColorStop(1, '#7a6650');
      g.fillStyle = ag;
      g.beginPath(); g.moveTo(cx - w / 2, bot); g.lineTo(cx - w / 2, top + w / 2);
      g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, bot); g.closePath(); g.fill();
      g.strokeStyle = '#fbf4e3'; g.lineWidth = 4; g.stroke();
    }
    // kolom tipis di antara lengkung
    g.fillStyle = '#fbf4e3';
    for (let k = 0; k <= 2; k++) g.fillRect(k * aw - 6, y + 18, 12, FH - 40);
    // cornice bawah
    g.fillStyle = '#d8c7a1'; g.fillRect(0, y + FH - 22, TW, 14);
    g.fillStyle = '#b9a47a'; g.fillRect(0, y + FH - 8, TW, 8);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, y, TW, 4);
  }
  return c;
}

const STYLES = {
  glass: { draw: drawGlass, tints: ['#ffffff', '#f2f7fb'], base: '#9aa4ad', top: '#7f98a8', baseTop: '#6d7f8b' },
  marble: { draw: drawMarble, tints: ['#ffffff', '#fbf8f2'], base: '#c9c0ad', top: '#f1ebde', baseTop: '#d8cfbc' },
  stone: { draw: drawStone, tints: ['#ffffff', '#fbf6ea'], base: '#c7b896', top: '#ead9b4', baseTop: '#d3c19b' }
};

const CAKE = ['#e05a7a', '#f7e6c4', '#4fae6b', '#f7e6c4', '#8a5634', '#f7e6c4', '#f2a541', '#f7e6c4', '#7a6fd6', '#f7e6c4'];

const shared = (m) => { m.userData.shared = true; return m; };

/** Ubah UV sisi samping supaya pola menempel ke posisi dunia (potongan tidak "bergeser"). */
function blockGeometry(b, i) {
  const geo = new THREE.BoxGeometry(b.w, H, b.d);
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  const f = ((i % FLOORS_PER_TEX) + FLOORS_PER_TEX) % FLOORS_PER_TEX;
  for (let k = 0; k < p.count; k++) {
    const nx = n.getX(k), ny = n.getY(k), nz = n.getZ(k);
    if (Math.abs(ny) > 0.5) continue;
    const wx = p.getX(k) + b.x, wz = p.getZ(k) + b.z;
    const u = nx > 0.5 ? -wz : nx < -0.5 ? wz : nz > 0.5 ? wx : -wx;
    uv.setXY(k, u, (f + (p.getY(k) + H / 2) / H) / FLOORS_PER_TEX);
  }
  return geo;
}

/** Buat "look" untuk satu bangunan: material bersama + pembuat geometri blok. */
export function createLook(building) {
  if (building.style === 'cake') {
    const mats = CAKE.map((c) => shared(new THREE.MeshLambertMaterial({ color: c })));
    return {
      materials: (i) => mats[i % mats.length],
      geometry: (b) => new THREE.BoxGeometry(b.w, H, b.d),
      sideMaterial: mats[0],
      dispose() { mats.forEach((m) => m.dispose()); }
    };
  }
  const S = STYLES[building.style];
  const tex = new THREE.CanvasTexture(S.draw());
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sides = S.tints.map((c) => shared(new THREE.MeshLambertMaterial({ map: tex, color: c })));
  const baseSide = shared(new THREE.MeshLambertMaterial({ map: tex, color: S.base }));
  const top = shared(new THREE.MeshLambertMaterial({ color: S.top }));
  const baseTop = shared(new THREE.MeshLambertMaterial({ color: S.baseTop }));
  const arr = sides.map((s) => [s, s, top, top, s, s]);
  const baseArr = [baseSide, baseSide, baseTop, baseTop, baseSide, baseSide];
  return {
    materials: (i) => (i === 0 ? baseArr : arr[i % arr.length]),
    geometry: blockGeometry,
    sideMaterial: sides[0],
    dispose() { tex.dispose(); [...sides, baseSide, top, baseTop].forEach((m) => m.dispose()); }
  };
}

/** Buang geometri & material milik sendiri (material bersama dilewati). */
export function disposeObject(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m) => { if (!m.userData.shared) m.dispose(); });
  });
}
