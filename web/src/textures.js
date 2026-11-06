// Tampilan per gaya bangunan. Semua tekstur digambar sendiri di <canvas>
// (tanpa foto/aset luar), jadi aman lisensinya.
//
// Tiap gaya menghasilkan beberapa lapisan peta PBR:
//   c = warna, b = relief (bump, abu-abu 128 = datar),
//   m = kekasaran (kanal G) & logam (kanal B), e = cahaya jendela (kaca saja).
import * as THREE from 'three';
import { H } from './logic.js';

const TW = 512;             // 1 unit dunia = 512 px
const FH = 256;             // 1 lantai (0.5 unit) = 256 px
const NF = 4;               // tekstur berulang tiap 4 lantai supaya tidak monoton
const TH = FH * NF;
const bandTop = (f) => (NF - 1 - f) * FH; // pita lantai ke-f (0 = paling bawah tekstur)

export function rng(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export const rm = (rough, metal) => `rgb(255,${Math.round(rough * 255)},${Math.round(metal * 255)})`;
const gray = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;

function layers(w, h, { emissive = false, rough = 0.6 } = {}) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = { c: mk(), b: mk(), m: mk() };
  if (emissive) cv.e = mk();
  const g = {};
  for (const k in cv) g[k] = cv[k].getContext('2d');
  g.b.fillStyle = gray(128); g.b.fillRect(0, 0, w, h);
  g.m.fillStyle = rm(rough, 0); g.m.fillRect(0, 0, w, h);
  if (g.e) { g.e.fillStyle = '#000'; g.e.fillRect(0, 0, w, h); }
  return { cv, g };
}
/** Isi persegi yang sama di beberapa lapisan sekaligus. */
function rect(g, x, y, w, h, { c, b, m, e }) {
  if (c != null) { g.c.fillStyle = c; g.c.fillRect(x, y, w, h); }
  if (b != null) { g.b.fillStyle = gray(b); g.b.fillRect(x, y, w, h); }
  if (m != null) { g.m.fillStyle = m; g.m.fillRect(x, y, w, h); }
  if (e != null && g.e) { g.e.fillStyle = e; g.e.fillRect(x, y, w, h); }
}
function speckle(ctx, x, y, w, h, n, rgb, alpha, r, size = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rgb},${alpha * r()})`;
    ctx.fillRect(x + r() * w, y + r() * h, size, size);
  }
}

/* ---------- Kaca: dinding tirai (curtain wall) pencakar langit ---------- */
function drawGlass() {
  const { cv, g } = layers(TW, TH, { emissive: true });
  const r = rng(7);
  const cols = 5, pw = TW / cols, sp = Math.round(FH * 0.24), mul = 9;
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f), vh = FH - sp;
    for (let k = 0; k < cols; k++) {
      const x = k * pw, l = r();
      const lit = r() < 0.09, blind = r() < 0.28;
      if (lit) {
        const grd = g.c.createLinearGradient(x, y, x, y + vh);
        grd.addColorStop(0, `hsl(${38 + l * 8} 55% ${70 + l * 10}%)`);
        grd.addColorStop(1, `hsl(${30 + l * 8} 45% ${48 + l * 10}%)`);
        g.c.fillStyle = grd; g.c.fillRect(x, y, pw, vh);
        rect(g, x, y, pw, vh, { m: rm(0.1, 0.05), b: 112, e: `hsl(38 85% ${46 + l * 18}%)` });
        // perabot & sekat ruangan, samar
        rect(g, x, y + vh * 0.68, pw, vh * 0.32, { c: 'rgba(70,45,25,.35)', e: 'rgba(0,0,0,.55)' });
        rect(g, x + pw * (0.2 + l * 0.5), y + vh * 0.35, pw * 0.08, vh * 0.33, { c: 'rgba(60,40,25,.3)', e: 'rgba(0,0,0,.4)' });
      } else {
        const grd = g.c.createLinearGradient(x, y, x + pw * 0.4, y + vh);
        grd.addColorStop(0, `hsl(204 45% ${50 + l * 8}%)`);
        grd.addColorStop(1, `hsl(214 55% ${32 + l * 8}%)`);
        g.c.fillStyle = grd; g.c.fillRect(x, y, pw, vh);
        rect(g, x, y, pw, vh, { m: rm(0.05 + l * 0.05, 0.6), b: 112 });
      }
      if (blind) {
        const bh = vh * (0.12 + r() * 0.5);
        rect(g, x, y, pw, bh, { c: 'rgba(222,216,200,.6)', m: rm(0.45, 0.25), e: 'rgba(0,0,0,.75)' });
        g.c.fillStyle = 'rgba(0,0,0,.08)';
        for (let s = y + 6; s < y + bh; s += 7) g.c.fillRect(x, s, pw, 2);
      }
    }
    // spandrel (panel kaca buram di depan pelat lantai) dengan titik frit
    rect(g, 0, y + vh, TW, sp, { c: '#34444f', m: rm(0.28, 0.65), b: 122, e: '#000' });
    g.c.fillStyle = 'rgba(255,255,255,.06)';
    for (let yy = y + vh + 6; yy < y + FH - 4; yy += 6) for (let xx = (yy % 12); xx < TW; xx += 12) g.c.fillRect(xx, yy, 2, 2);
    // transom & mullion aluminium (menonjol)
    const alu = { c: '#b9c3ca', m: rm(0.32, 1), b: 225, e: '#000' };
    rect(g, 0, y + vh - 5, TW, 9, alu);
    rect(g, 0, y, TW, 4, alu);
    rect(g, 0, y + FH - 3, TW, 3, { ...alu, c: '#8d989f' });
    for (let k = 0; k <= cols; k++) {
      rect(g, k * pw - mul / 2, y, mul, FH, alu);
      rect(g, k * pw + mul / 2 - 2, y, 2, FH, { c: 'rgba(0,0,0,.18)' }); // bayangan sirip
    }
  }
  return cv;
}

/* ---------- Marmer: tugu berlapis panel marmer putih ---------- */
function drawMarble() {
  const { cv, g } = layers(TW, TH, { rough: 0.38 });
  const r = rng(11);
  const courses = 1, ch = FH / courses, sw = TW;
  for (let f = 0; f < NF; f++) {
    for (let cIdx = 0; cIdx < courses; cIdx++) {
      const y = bandTop(f) + cIdx * ch;
      const off = ((f * courses + cIdx) % 2) * (sw / 2);
      for (let s = -1; s <= 2; s++) {
        const x = off + s * sw, tone = 87 + r() * 5;
        g.c.save(); g.c.beginPath(); g.c.rect(x, y, sw, ch); g.c.clip();
        g.c.fillStyle = `hsl(${38 + r() * 6} ${12 + r() * 8}% ${tone}%)`; g.c.fillRect(x, y, sw, ch);
        // urat marmer
        for (let v = 0; v < 3; v++) {
          g.c.strokeStyle = `rgba(120,112,100,${0.1 + r() * 0.15})`; g.c.lineWidth = 0.8 + r() * 1.6;
          g.c.beginPath(); let px = x + r() * sw, py = y + r() * ch; g.c.moveTo(px, py);
          for (let k = 0; k < 6; k++) { px += (r() - 0.35) * 60; py += (r() - 0.5) * 34; g.c.lineTo(px, py); }
          g.c.stroke();
        }
        // noda air hujan mengalir dari sambungan atas
        for (let d = 0; d < 4; d++) {
          const dx = x + r() * sw, dl = ch * (0.3 + r() * 0.7);
          const gr = g.c.createLinearGradient(0, y, 0, y + dl);
          gr.addColorStop(0, 'rgba(90,82,70,.12)'); gr.addColorStop(1, 'rgba(90,82,70,0)');
          g.c.fillStyle = gr; g.c.fillRect(dx, y, 3 + r() * 6, dl);
        }
        const sh = g.c.createLinearGradient(0, y, 0, y + ch);
        sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(1, 'rgba(60,50,40,.07)');
        g.c.fillStyle = sh; g.c.fillRect(x, y, sw, ch);
        g.c.restore();
        rect(g, x, y, sw, ch, { b: 140 + r() * 14, m: rm(0.3 + r() * 0.14, 0) });
        // sambungan nat (cekung)
        rect(g, x, y, sw, 2, { c: '#bdb4a2', b: 90, m: rm(0.8, 0) });
        rect(g, x, y, 2, ch, { c: '#bdb4a2', b: 90, m: rm(0.8, 0) });
      }
    }
  }
  speckle(g.c, 0, 0, TW, TH, 9000, '105,95,80', 0.12, r, 1.5);
  speckle(g.b, 0, 0, TW, TH, 5000, '90,90,90', 0.25, r, 2);
  return cv;
}

/* ---------- Batu: galeri lengkung bertiang (gaya romanesque) ---------- */
function archPath(ctx, cx, top, bot, ow) {
  const spring = top + ow / 2;
  ctx.beginPath(); ctx.moveTo(cx - ow / 2, bot); ctx.lineTo(cx - ow / 2, spring);
  ctx.arc(cx, spring, ow / 2, Math.PI, 0); ctx.lineTo(cx + ow / 2, bot); ctx.closePath();
}
function drawStone() {
  const { cv, g } = layers(TW, TH, { rough: 0.72 });
  const r = rng(23);
  const arches = 3, aw = TW / arches, corn = Math.round(FH * 0.17);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f), bot = y + FH - corn;
    rect(g, 0, y, TW, FH, { c: `hsl(${40 + f} ${18 + f * 2}% ${83 - f * 1.5}%)`, b: 150 });
    // susunan blok batu
    for (let yy = y; yy < bot; yy += FH / 5) {
      const o = ((yy / (FH / 5)) | 0) % 2 ? 0 : 40;
      for (let xx = -o; xx < TW; xx += 80) {
        g.c.fillStyle = `rgba(${r() < 0.5 ? '255,250,240' : '120,105,85'},${0.05 + r() * 0.08})`;
        g.c.fillRect(xx, yy, 80, FH / 5);
        rect(g, xx, yy, 80, 2, { c: 'rgba(130,115,95,.35)', b: 100 });
        rect(g, xx, yy, 2, FH / 5, { c: 'rgba(130,115,95,.3)', b: 100 });
      }
    }
    for (let k = 0; k < arches; k++) {
      const cx = k * aw + aw / 2, colW = aw * 0.2, ow = aw - colW, top = y + FH * 0.1;
      // ruang galeri yang gelap di dalam lengkung
      const dg = g.c.createLinearGradient(0, top, 0, bot);
      dg.addColorStop(0, '#463d33'); dg.addColorStop(0.55, '#6c5f4f'); dg.addColorStop(1, '#93836d');
      archPath(g.c, cx, top, bot, ow); g.c.fillStyle = dg; g.c.fill();
      archPath(g.b, cx, top, bot, ow); g.b.fillStyle = gray(40); g.b.fill();
      archPath(g.m, cx, top, bot, ow); g.m.fillStyle = rm(0.95, 0); g.m.fill();
      // dinding dalam dengan pintu
      const iw = ow * 0.36;
      archPath(g.c, cx, top + ow * 0.42, bot, iw); g.c.fillStyle = 'rgba(30,22,16,.55)'; g.c.fill();
      // archivolt (bingkai lengkung) menonjol
      archPath(g.c, cx, top, bot + 40, ow + 10); g.c.save(); g.c.beginPath(); g.c.rect(0, y, TW, bot - y); g.c.clip();
      g.c.strokeStyle = '#f4eee0'; g.c.lineWidth = 9; archPath(g.c, cx, top - 4, bot, ow + 8); g.c.stroke();
      g.c.strokeStyle = 'rgba(80,65,45,.35)'; g.c.lineWidth = 2; archPath(g.c, cx, top + 1, bot, ow - 2); g.c.stroke();
      g.c.restore();
      g.b.save(); g.b.beginPath(); g.b.rect(0, y, TW, bot - y); g.b.clip();
      g.b.strokeStyle = gray(215); g.b.lineWidth = 9; archPath(g.b, cx, top - 4, bot, ow + 8); g.b.stroke(); g.b.restore();
      // tiang: sorotan cahaya & kapitel
      const px = k * aw;
      const cg = g.c.createLinearGradient(px - colW / 2, 0, px + colW / 2, 0);
      cg.addColorStop(0, 'rgba(255,255,255,.0)'); cg.addColorStop(0.35, 'rgba(255,255,255,.28)'); cg.addColorStop(1, 'rgba(60,45,30,.18)');
      g.c.fillStyle = cg; g.c.fillRect(px - colW / 2, top + ow / 2, colW, bot - top - ow / 2);
      rect(g, px - colW / 2 - 6, top + ow / 2 - 8, colW + 12, 12, { c: '#f6f0e2', b: 225 });
      rect(g, px - colW / 2 - 6, top + ow / 2 + 4, colW + 12, 3, { c: 'rgba(80,65,45,.35)' });
      if (k === 0) { // sambungan di tepi (tekstur berulang)
        g.c.fillStyle = cg; g.c.fillRect(TW - colW / 2, top + ow / 2, colW / 2, bot - top - ow / 2);
        rect(g, TW - colW / 2 - 6, top + ow / 2 - 8, colW / 2 + 6, 12, { c: '#f6f0e2', b: 225 });
      }
    }
    // cornice (list) di bawah galeri
    rect(g, 0, bot, TW, corn, { c: '#ebe3cf', b: 205, m: rm(0.6, 0) });
    rect(g, 0, bot + corn * 0.4, TW, 5, { c: '#ada08a', b: 110 });
    rect(g, 0, bot, TW, 3, { c: '#fbf7ec', b: 235 });
    rect(g, 0, y + FH - 3, TW, 3, { c: '#8f826c', b: 90 });
    // kotoran cuaca mengalir dari list
    for (let d = 0; d < 26; d++) {
      const dx = r() * TW, dl = FH * (0.15 + r() * 0.5);
      const gr = g.c.createLinearGradient(0, y, 0, y + dl);
      gr.addColorStop(0, 'rgba(80,70,55,.14)'); gr.addColorStop(1, 'rgba(80,70,55,0)');
      g.c.fillStyle = gr; g.c.fillRect(dx, y, 3 + r() * 8, dl);
    }
  }
  speckle(g.c, 0, 0, TW, TH, 8000, '100,85,65', 0.14, r, 1.5);
  speckle(g.b, 0, 0, TW, TH, 6000, '80,80,80', 0.3, r, 2);
  return cv;
}

/* ---------- Atap: ubin / beton (UV dunia, 512 px per unit) ---------- */
function drawRoof({ base, joint, tile, rough, seed }) {
  const { cv, g } = layers(512, 512, { rough });
  const r = rng(seed);
  for (let y = 0; y < 512; y += tile) for (let x = 0; x < 512; x += tile) {
    const l = r() * 6 - 3;
    rect(g, x, y, tile, tile, { c: `hsl(${base[0]} ${base[1]}% ${base[2] + l}%)`, b: 140 });
    rect(g, x, y, tile, 3, { c: joint, b: 80 }); rect(g, x, y, 3, tile, { c: joint, b: 80 });
  }
  speckle(g.c, 0, 0, 512, 512, 4000, '80,70,60', 0.12, r, 1.5);
  return cv;
}

const STYLES = {
  glass: { draw: drawGlass, bump: 1.2, tints: ['#ffffff', '#f4f8fb'], base: '#8d969d',
    roof: { base: [205, 6, 52], joint: '#4c555b', tile: 256, rough: 0.85, seed: 3 } },
  marble: { draw: drawMarble, bump: 0.8, tints: ['#ffffff', '#fbf8f2'], base: '#cfc7b6',
    roof: { base: [40, 14, 86], joint: '#bdb3a2', tile: 256, rough: 0.4, seed: 5 } },
  stone: { draw: drawStone, round: true, roofColor: '#e3d6ba', bump: 1.4, tints: ['#ffffff', '#f9f4e8'], base: '#cbbd9e', ledge: '#efe7d4',
    roof: { base: [40, 18, 80], joint: '#a89a80', tile: 96, rough: 0.7, seed: 9 } }
};

const CAKE = ['#e05a7a', '#f7e6c4', '#4fae6b', '#f7e6c4', '#8a5634', '#f7e6c4', '#f2a541', '#f7e6c4', '#7a6fd6', '#f7e6c4'];

const shared = (m) => { m.userData.shared = true; return m; };

function canvasTexture(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Geometri blok dengan UV mengikuti posisi dunia, supaya pola tetap
 * menyambung saat lantai terpotong.
 */
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

/** Lantai bundar (elips di dalam kotak w×d) untuk menara gaya batu. */
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

/** Buat "look" untuk satu bangunan: material bersama + pembuat geometri blok. */
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
  const S = STYLES[building.style];
  const L = S.draw();
  const map = canvasTexture(L.c, true), bump = canvasTexture(L.b, false), orm = canvasTexture(L.m, false);
  const emis = L.e ? canvasTexture(L.e, true) : null;
  const R = drawRoof(S.roof);
  const rMap = canvasTexture(R.c, true), rBump = canvasTexture(R.b, false), rOrm = canvasTexture(R.m, false);
  const textures = [map, bump, orm, emis, rMap, rBump, rOrm].filter(Boolean);

  const sideProps = (color) => ({
    color, map, bumpMap: bump, bumpScale: S.bump, roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1,
    ...(emis ? { emissiveMap: emis, emissive: '#ffffff', emissiveIntensity: 1.2 } : {})
  });
  const sides = S.tints.map((c) => shared(new THREE.MeshStandardMaterial(sideProps(c))));
  const baseSide = shared(new THREE.MeshStandardMaterial({ ...sideProps(S.base), emissiveIntensity: 0.3 }));
  // Tutup silinder berupa kipas segitiga tipis: tekstur memunculkan garis jari-jari, jadi pakai warna polos.
  const roof = shared(S.round
    ? new THREE.MeshStandardMaterial({ color: S.roofColor, roughness: 0.75 })
    : new THREE.MeshStandardMaterial({ map: rMap, bumpMap: rBump, bumpScale: 0.6, roughnessMap: rOrm, roughness: 1, metalness: 0 }));
  const ledge = S.ledge ? shared(new THREE.MeshStandardMaterial({ color: S.ledge, roughness: 0.6, bumpMap: bump, bumpScale: 0.5 })) : null;
  const mats = [...sides, baseSide, roof, ledge].filter(Boolean);
  const round = !!S.round;
  // Kotak: urutan grup +x,-x,+y,-y,+z,-z. Silinder: sisi, tutup atas, tutup bawah.
  const arr = sides.map((s) => (round ? [s, roof, roof] : [s, s, roof, roof, s, s]));
  const baseArr = round ? [baseSide, roof, roof] : [baseSide, baseSide, roof, roof, baseSide, baseSide];
  const ledgeGeoFor = (b) => {
    if (!round) return new THREE.BoxGeometry(b.w + 0.08, 0.055, b.d + 0.08);
    const g = new THREE.CylinderGeometry(0.5, 0.5, 0.055, 48); g.scale(b.w + 0.08, 1, b.d + 0.08); return g;
  };

  return {
    materials: (i) => (i === 0 ? baseArr : arr[i % arr.length]),
    geometry: round ? roundGeometry : blockGeometry,
    sideMaterial: sides[0],
    roofMaterial: roof,
    /** Tambahan geometri per lantai (list batu menonjol). */
    decorate(mesh, b) {
      if (!ledge) return;
      const l = new THREE.Mesh(ledgeGeoFor(b), ledge);
      l.position.y = H / 2 - 0.0325; // puncak list sedikit di bawah atap lantai (hindari z-fighting)
      l.castShadow = true; l.receiveShadow = true;
      mesh.add(l);
    },
    /** Material fasad untuk silinder (mis. menara lonceng): pola diulang `around` kali. */
    cylinderMaterial(around) {
      const clone = (t) => { const c = t.clone(); c.repeat.set(around, 1 / NF); c.needsUpdate = true; return c; };
      const m = new THREE.MeshStandardMaterial({ ...sideProps('#ffffff'), map: clone(map), bumpMap: clone(bump), roughnessMap: clone(orm), metalnessMap: null, metalness: 0 });
      m.userData.ownTextures = [m.map, m.bumpMap, m.roughnessMap];
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
