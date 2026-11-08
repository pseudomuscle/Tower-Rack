// Pelukis fasad prosedural. Tiap gaya menggambar 4 lantai (512×1024 px,
// 1 unit = 512 px, 1 lantai = 256 px) pada beberapa lapisan peta PBR:
//   c = warna, b = relief (abu-abu 128 = datar),
//   m = kekasaran (kanal G) & logam (kanal B), e = cahaya jendela malam.
// Semua digambar sendiri, tanpa foto atau aset luar.

export const TW = 512, FH = 256, NF = 4, TH = FH * NF;
const bandTop = (f) => (NF - 1 - f) * FH; // pita lantai ke-f (0 = paling bawah tekstur)

export function rng(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export const rm = (rough, metal) => `rgb(255,${Math.round(rough * 255)},${Math.round(metal * 255)})`;
const gray = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;

export function layers(w, h, rough = 0.6) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cv = { c: mk(), b: mk(), m: mk(), e: mk() };
  const g = {};
  for (const k in cv) g[k] = cv[k].getContext('2d');
  g.b.fillStyle = gray(128); g.b.fillRect(0, 0, w, h);
  g.m.fillStyle = rm(rough, 0); g.m.fillRect(0, 0, w, h);
  g.e.fillStyle = '#000'; g.e.fillRect(0, 0, w, h);
  return { cv, g };
}
/** Isi persegi yang sama di beberapa lapisan sekaligus. */
export function rect(g, x, y, w, h, { c, b, m, e }) {
  if (c != null) { g.c.fillStyle = c; g.c.fillRect(x, y, w, h); }
  if (b != null) { g.b.fillStyle = gray(b); g.b.fillRect(x, y, w, h); }
  if (m != null) { g.m.fillStyle = m; g.m.fillRect(x, y, w, h); }
  if (e != null) { g.e.fillStyle = e; g.e.fillRect(x, y, w, h); }
}
/** Isi bentuk (path) yang sama di beberapa lapisan. */
function shape(g, pathFn, { c, b, m, e }) {
  const fill = (ctx, style) => { ctx.beginPath(); pathFn(ctx); ctx.fillStyle = style; ctx.fill(); };
  if (c != null) fill(g.c, c);
  if (b != null) fill(g.b, gray(b));
  if (m != null) fill(g.m, m);
  if (e != null) fill(g.e, e);
}
export function speckle(ctx, x, y, w, h, n, rgb, alpha, r, size = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rgb},${alpha * r()})`;
    ctx.fillRect(x + r() * w, y + r() * h, size, size);
  }
}
function streaks(g, r, y, n, len, rgb = '80,70,55', a = 0.12) {
  for (let d = 0; d < n; d++) {
    const dx = r() * TW, dl = len * (0.3 + r() * 0.7);
    const gr = g.c.createLinearGradient(0, y, 0, y + dl);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.c.fillStyle = gr; g.c.fillRect(dx, y, 2 + r() * 6, dl);
  }
}
const archPath = (cx, top, bot, w) => (ctx) => {
  const spring = top + w / 2;
  ctx.moveTo(cx - w / 2, bot); ctx.lineTo(cx - w / 2, spring);
  ctx.arc(cx, spring, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, bot); ctx.closePath();
};
const pointedPath = (cx, top, bot, w) => (ctx) => {
  const spring = top + w * 0.75;
  ctx.moveTo(cx - w / 2, bot); ctx.lineTo(cx - w / 2, spring);
  ctx.quadraticCurveTo(cx - w / 2, top + w * 0.15, cx, top);
  ctx.quadraticCurveTo(cx + w / 2, top + w * 0.15, cx + w / 2, spring);
  ctx.lineTo(cx + w / 2, bot); ctx.closePath();
};
const rectPath = (x, y, w, h) => (ctx) => ctx.rect(x, y, w, h);

/**
 * Jendela berkaca dengan bingkai. `kind`: 'rect' | 'arch' | 'pointed'.
 * Sebagian jendela menyala (lapisan e) untuk suasana malam.
 */
function windowAt(g, r, { cx, top, bot, w, kind = 'rect', frame = '#e9e2d4', glass = '#2e3c48', lit = 0.3, mullion = true, fw = 6 }) {
  const P = kind === 'arch' ? archPath : kind === 'pointed' ? pointedPath : (cx0, t, b0, ww) => rectPath(cx0 - ww / 2, t, ww, b0 - t);
  shape(g, P(cx, top - fw, bot + fw, w + fw * 2), { c: frame, b: 200, m: rm(0.5, 0) });
  const on = r() < lit;
  const l = r();
  const grd = g.c.createLinearGradient(cx - w / 2, top, cx + w / 2, bot);
  grd.addColorStop(0, on ? '#f6d9a0' : glass); grd.addColorStop(1, on ? '#c98f4e' : shade(glass, -0.25 + l * 0.15));
  shape(g, P(cx, top, bot, w), { b: 70, m: rm(0.08, 0.6), e: on ? `hsl(38 85% ${45 + l * 20}%)` : '#000' });
  g.c.beginPath(); P(cx, top, bot, w)(g.c); g.c.fillStyle = grd; g.c.fill();
  // pantulan langit di bagian atas kaca
  g.c.save(); g.c.beginPath(); P(cx, top, bot, w)(g.c); g.c.clip();
  g.c.fillStyle = 'rgba(255,255,255,.12)'; g.c.fillRect(cx - w / 2, top, w, (bot - top) * 0.3);
  if (mullion) { g.c.fillStyle = frame; g.c.fillRect(cx - 2, top, 4, bot - top); g.c.fillRect(cx - w / 2, top + (bot - top) * 0.45, w, 4); }
  g.c.restore();
}
function shade(hex, k) { // gelapkan/terangkan warna hex sedikit
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (k > 0 ? (255 - v) * k : v * k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/* ---------- Kaca: dinding tirai pencakar langit ---------- */
function glass(o) {
  const { hue = 206, sat = 48, light = 50, cols = 5, lit = 0.09, alu = '#b9c3ca', spandrel = '#34444f', fins = true } = o;
  const { cv, g } = layers(TW, TH);
  const r = rng(7 + hue);
  const pw = TW / cols, sp = Math.round(FH * 0.24), mul = 9;
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f), vh = FH - sp;
    for (let k = 0; k < cols; k++) {
      const x = k * pw, l = r();
      const on = r() < lit, blind = r() < 0.28;
      if (on) {
        const grd = g.c.createLinearGradient(x, y, x, y + vh);
        grd.addColorStop(0, `hsl(${38 + l * 8} 55% ${70 + l * 10}%)`);
        grd.addColorStop(1, `hsl(${30 + l * 8} 45% ${48 + l * 10}%)`);
        g.c.fillStyle = grd; g.c.fillRect(x, y, pw, vh);
        rect(g, x, y, pw, vh, { m: rm(0.1, 0.05), b: 112, e: `hsl(38 85% ${46 + l * 18}%)` });
        rect(g, x, y + vh * 0.68, pw, vh * 0.32, { c: 'rgba(70,45,25,.35)', e: 'rgba(0,0,0,.55)' });
      } else {
        const grd = g.c.createLinearGradient(x, y, x + pw * 0.4, y + vh);
        grd.addColorStop(0, `hsl(${hue - 2} ${sat - 3}% ${light + l * 8}%)`);
        grd.addColorStop(1, `hsl(${hue + 8} ${sat + 7}% ${light - 18 + l * 8}%)`);
        g.c.fillStyle = grd; g.c.fillRect(x, y, pw, vh);
        rect(g, x, y, pw, vh, { m: rm(0.05 + l * 0.05, 0.6), b: 112 });
      }
      if (blind) {
        const bh = vh * (0.12 + r() * 0.5);
        rect(g, x, y, pw, bh, { c: 'rgba(222,216,200,.55)', m: rm(0.45, 0.25), e: 'rgba(0,0,0,.75)' });
      }
    }
    rect(g, 0, y + vh, TW, sp, { c: spandrel, m: rm(0.28, 0.65), b: 122, e: '#000' });
    const a = { c: alu, m: rm(0.32, 1), b: 225, e: '#000' };
    rect(g, 0, y + vh - 5, TW, 9, a);
    rect(g, 0, y, TW, 4, a);
    if (fins) for (let k = 0; k <= cols; k++) {
      rect(g, k * pw - mul / 2, y, mul, FH, a);
      rect(g, k * pw + mul / 2 - 2, y, 2, FH, { c: 'rgba(0,0,0,.18)' });
    }
  }
  return cv;
}

/* ---------- Marmer / batu pahat: panel besar, urat halus ---------- */
function marble(o) {
  const { hue = 40, sat = 14, light = 89, glyphs = false } = o;
  const { cv, g } = layers(TW, TH, 0.38);
  const r = rng(11 + hue);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f), off = (f % 2) * (TW / 2);
    for (let s = -1; s <= 1; s++) {
      const x = off + s * TW;
      g.c.save(); g.c.beginPath(); g.c.rect(x, y, TW, FH); g.c.clip();
      g.c.fillStyle = `hsl(${hue + r() * 6 - 3} ${sat + r() * 6}% ${light - 2 + r() * 4}%)`; g.c.fillRect(x, y, TW, FH);
      for (let v = 0; v < 4; v++) {
        g.c.strokeStyle = `rgba(110,102,90,${0.08 + r() * 0.12})`; g.c.lineWidth = 0.8 + r() * 1.6;
        g.c.beginPath(); let px = x + r() * TW, py = y + r() * FH; g.c.moveTo(px, py);
        for (let k = 0; k < 6; k++) { px += (r() - 0.35) * 70; py += (r() - 0.5) * 40; g.c.lineTo(px, py); }
        g.c.stroke();
      }
      g.c.restore();
      rect(g, x, y, TW, 2, { c: shade(hsl(hue, sat, light), -0.2), b: 90, m: rm(0.8, 0) });
      rect(g, x, y, 2, FH, { c: shade(hsl(hue, sat, light), -0.2), b: 90, m: rm(0.8, 0) });
    }
    if (glyphs) { // ukiran simbol di kolom tengah
      for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) {
        const cx = TW * 0.38 + col * TW * 0.12, cy = y + 30 + row * 44, k = (r() * 4) | 0;
        g.c.fillStyle = 'rgba(70,55,35,.35)'; g.b.fillStyle = gray(70);
        for (const ctx of [g.c, g.b]) {
          ctx.beginPath();
          if (k === 0) ctx.arc(cx, cy, 9, 0, 7);
          else if (k === 1) ctx.rect(cx - 10, cy - 3, 20, 6);
          else if (k === 2) { ctx.moveTo(cx - 9, cy + 9); ctx.lineTo(cx, cy - 10); ctx.lineTo(cx + 9, cy + 9); }
          else { ctx.ellipse(cx, cy, 5, 11, 0.4, 0, 7); }
          ctx.fill();
        }
      }
    }
    streaks(g, r, y, 10, FH * 0.8);
  }
  speckle(g.c, 0, 0, TW, TH, 9000, '105,95,80', 0.12, r, 1.5);
  speckle(g.b, 0, 0, TW, TH, 5000, '90,90,90', 0.25, r, 2);
  return cv;
}
const hsl = (h, s, l) => { // ke hex (untuk shade)
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/* ---------- Galeri lengkung bertiang (romanesque) ---------- */
function arcade(o) {
  const { hue = 40, sat = 20, light = 83, arches = 3 } = o;
  const { cv, g } = layers(TW, TH, 0.72);
  const r = rng(23);
  const aw = TW / arches, corn = Math.round(FH * 0.17);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f), bot = y + FH - corn;
    rect(g, 0, y, TW, FH, { c: `hsl(${hue} ${sat}% ${light - f * 1.5}%)`, b: 150 });
    for (let yy = y; yy < bot; yy += FH / 5) {
      const off = ((yy / (FH / 5)) | 0) % 2 ? 0 : 40;
      for (let xx = -off; xx < TW; xx += 80) {
        g.c.fillStyle = `rgba(${r() < 0.5 ? '255,250,240' : '120,105,85'},${0.05 + r() * 0.08})`;
        g.c.fillRect(xx, yy, 80, FH / 5);
        rect(g, xx, yy, 80, 2, { c: 'rgba(130,115,95,.35)', b: 100 });
      }
    }
    for (let k = 0; k < arches; k++) {
      const cx = k * aw + aw / 2, colW = aw * 0.2, ow = aw - colW, top = y + FH * 0.1;
      const dg = g.c.createLinearGradient(0, top, 0, bot);
      dg.addColorStop(0, '#463d33'); dg.addColorStop(0.55, '#6c5f4f'); dg.addColorStop(1, '#93836d');
      shape(g, archPath(cx, top, bot, ow), { c: dg, b: 40, m: rm(0.95, 0), e: r() < 0.2 ? '#7a5a30' : '#000' });
      shape(g, archPath(cx, top + ow * 0.42, bot, ow * 0.36), { c: 'rgba(30,22,16,.55)' });
      g.c.save(); g.c.beginPath(); g.c.rect(0, y, TW, bot - y); g.c.clip();
      g.c.strokeStyle = '#f4eee0'; g.c.lineWidth = 9; g.c.beginPath(); archPath(cx, top - 4, bot, ow + 8)(g.c); g.c.stroke();
      g.c.restore();
      const px = k * aw;
      rect(g, px - colW / 2 - 6, top + ow / 2 - 8, colW + 12, 12, { c: '#f6f0e2', b: 225 });
    }
    rect(g, 0, bot, TW, corn, { c: '#ebe3cf', b: 205, m: rm(0.6, 0) });
    rect(g, 0, bot + corn * 0.4, TW, 5, { c: '#ada08a', b: 110 });
    streaks(g, r, y, 26, FH * 0.5);
  }
  speckle(g.c, 0, 0, TW, TH, 8000, '100,85,65', 0.14, r, 1.5);
  return cv;
}

/* ---------- Bata merah dengan jendela berbingkai ---------- */
function brick(o) {
  const { color = '#9c4a33', mortar = '#c8b7a2', win = 'arch', trim = '#ece3d2', cols = 2, lit = 0.3, glassC = '#2b3740', winH = 0.5 } = o;
  const { cv, g } = layers(TW, TH, 0.85);
  const r = rng(31 + cols);
  const base = parseInt(color.slice(1), 16);
  const br = (base >> 16) & 255, bg = (base >> 8) & 255, bb = base & 255;
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: mortar, b: 90 });
    const bh = 16, bw = 48;
    for (let row = 0; row < FH / bh; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = -off; x < TW; x += bw) {
        const v = (r() - 0.5) * 40;
        rect(g, x + 1.5, y + row * bh + 1.5, bw - 3, bh - 3, { c: `rgb(${br + v | 0},${bg + v * 0.6 | 0},${bb + v * 0.5 | 0})`, b: 150 + r() * 20 });
      }
    }
    // list batu di bawah lantai
    rect(g, 0, y + FH - 18, TW, 18, { c: trim, b: 210, m: rm(0.6, 0) });
    rect(g, 0, y + FH - 4, TW, 4, { c: 'rgba(0,0,0,.25)', b: 100 });
    if (win !== 'none') {
      const cw = TW / cols;
      for (let k = 0; k < cols; k++) {
        windowAt(g, r, { cx: k * cw + cw / 2, top: y + FH * 0.16, bot: y + FH * (0.16 + winH), w: cw * 0.36, kind: win, frame: trim, glass: glassC, lit });
        rect(g, k * cw + cw * 0.28, y + FH * (0.16 + winH) + 6, cw * 0.44, 10, { c: trim, b: 210 }); // ambang jendela
      }
    }
    streaks(g, r, y, 12, FH * 0.6, '40,30,25', 0.15);
  }
  return cv;
}

/* ---------- Plester / dinding kapur ---------- */
function plaster(o) {
  const { wall = '#f1ece2', trim = '#c9b48a', win = 'rect', cols = 2, lit = 0.25, shutter = null, band = null, glassC = '#2d3944', winH = 0.48 } = o;
  const { cv, g } = layers(TW, TH, 0.8);
  const r = rng(41 + cols);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: wall, b: 140 });
    speckle(g.c, 0, y, TW, FH, 2500, '120,110,90', 0.08, r, 3);
    if (band) { // pita hias segitiga di bawah lantai
      rect(g, 0, y + FH - 30, TW, 30, { c: band, b: 190 });
      g.c.fillStyle = trim;
      for (let x = 0; x < TW; x += 32) { g.c.beginPath(); g.c.moveTo(x, y + FH - 30); g.c.lineTo(x + 16, y + FH - 10); g.c.lineTo(x + 32, y + FH - 30); g.c.fill(); }
    }
    rect(g, 0, y + FH - 6, TW, 6, { c: trim, b: 200 });
    if (win !== 'none') {
      const cw = TW / cols;
      for (let k = 0; k < cols; k++) {
        const cx = k * cw + cw / 2, ww = win === 'slit' ? cw * 0.1 : cw * 0.34;
        const top = y + FH * 0.18, bot = y + FH * (0.18 + (win === 'slit' ? 0.4 : winH));
        windowAt(g, r, { cx, top, bot, w: ww, kind: win === 'slit' ? 'arch' : win, frame: trim, glass: glassC, lit, mullion: win !== 'slit', fw: win === 'slit' ? 4 : 6 });
        if (shutter) for (const s of [-1, 1]) {
          rect(g, cx + s * (ww / 2 + 8) - (s < 0 ? ww * 0.5 : 0), top - 4, ww * 0.5, bot - top + 8, { c: shutter, b: 175 });
          g.c.fillStyle = 'rgba(0,0,0,.15)';
          for (let yy = top; yy < bot; yy += 10) g.c.fillRect(cx + s * (ww / 2 + 8) - (s < 0 ? ww * 0.5 : 0), yy, ww * 0.5, 3);
        }
      }
    }
    streaks(g, r, y, 18, FH * 0.7, '90,80,60', 0.1);
  }
  return cv;
}

/* ---------- Beton (menara TV, gedung modern) ---------- */
function concrete(o) {
  const { color = '#d3d0c9', ribbon = false, vlines = true, lit = 0.25 } = o;
  const { cv, g } = layers(TW, TH, 0.88);
  const r = rng(53);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: color, b: 140 });
    speckle(g.c, 0, y, TW, FH, 4000, '70,70,70', 0.12, r, 2);
    if (vlines) for (let x = 0; x < TW; x += 64) rect(g, x, y, 3, FH, { c: 'rgba(0,0,0,.12)', b: 100 });
    rect(g, 0, y + FH - 3, TW, 3, { c: 'rgba(0,0,0,.18)', b: 95 });
    if (ribbon) { // pita jendela memanjang
      const top = y + FH * 0.3, h = FH * 0.32;
      rect(g, 0, top - 6, TW, h + 12, { c: '#bfbcb5', b: 210 });
      for (let x = 0; x < TW; x += 64) {
        const on = r() < lit;
        rect(g, x + 3, top, 58, h, { c: on ? '#e9c98f' : '#33424d', b: 80, m: rm(0.08, 0.6), e: on ? '#f0b860' : '#000' });
        rect(g, x + 3, top, 58, h * 0.3, { c: 'rgba(255,255,255,.14)' });
      }
    }
    streaks(g, r, y, 24, FH * 0.9, '60,60,60', 0.1);
  }
  return cv;
}

/* ---------- Pagoda kayu ---------- */
function pagoda(o) {
  const { wall = '#a3312a', pillar = '#4a2a1c', screen = '#e8d8b4', lit = 0.35 } = o;
  const { cv, g } = layers(TW, TH, 0.7);
  const r = rng(61);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: wall, b: 150 });
    // panel kisi kertas di antara tiang
    const n = 4, pw = TW / n;
    for (let k = 0; k < n; k++) {
      const x = k * pw + pw * 0.18, w = pw * 0.64, top = y + FH * 0.22, h = FH * 0.5;
      const on = r() < lit;
      rect(g, x, top, w, h, { c: on ? '#f5d79a' : screen, b: 110, e: on ? '#e8a24a' : '#000' });
      g.c.fillStyle = pillar; g.b.fillStyle = gray(170);
      for (let gx = x; gx <= x + w; gx += w / 4) { g.c.fillRect(gx - 2, top, 4, h); g.b.fillRect(gx - 2, top, 4, h); }
      for (let gy = top; gy <= top + h; gy += h / 5) { g.c.fillRect(x, gy - 2, w, 4); g.b.fillRect(x, gy - 2, w, 4); }
    }
    for (let k = 0; k <= n; k++) rect(g, k * pw - 10, y, 20, FH, { c: pillar, b: 215 });
    rect(g, 0, y, TW, 26, { c: pillar, b: 200 });        // balok atas
    rect(g, 0, y + FH - 20, TW, 20, { c: '#5a3a26', b: 205 }); // lantai/balok bawah
    speckle(g.c, 0, y, TW, FH, 2000, '30,15,10', 0.15, r, 2);
  }
  return cv;
}

/* ---------- Belang mercusuar ---------- */
function stripes(o) {
  const { a = '#f4f1ea', b = '#c23b32', spiral = false, windows = true } = o;
  const { cv, g } = layers(TW, TH, 0.55);
  const r = rng(71);
  if (spiral) {
    for (let y = 0; y < TH; y += 2) for (let x = 0; x < TW; x += 8) {
      const band = Math.floor((x / TW + (TH - y) / TH) * 2) % 2;
      g.c.fillStyle = band ? b : a; g.c.fillRect(x, y, 8, 2);
    }
  } else {
    for (let f = 0; f < NF; f++) rect(g, 0, bandTop(f), TW, FH, { c: f < 2 ? a : b, b: 140 });
  }
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    if (windows && f % 2 === 0) windowAt(g, r, { cx: TW / 2, top: y + FH * 0.3, bot: y + FH * 0.62, w: 40, kind: 'arch', frame: '#d9d4c8', lit: 0.5, mullion: false });
    streaks(g, r, y, 14, FH * 0.8, '60,50,40', 0.08);
  }
  speckle(g.c, 0, 0, TW, TH, 5000, '80,70,60', 0.08, r, 2);
  return cv;
}

/* ---------- Art deco: tiang vertikal & panel spandrel ---------- */
function deco(o) {
  const { stone = '#d9cfbd', panel = '#5a5248', glassC = '#31404b', piers = 6, lit = 0.25 } = o;
  const { cv, g } = layers(TW, TH, 0.6);
  const r = rng(83);
  const pw = TW / piers;
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: stone, b: 160 });
    for (let k = 0; k < piers; k++) {
      const x = k * pw + 14, w = pw - 28, on = r() < lit;
      rect(g, x, y + 20, w, FH * 0.55, { c: on ? '#ecc98c' : glassC, b: 70, m: rm(0.1, 0.6), e: on ? '#f0b05a' : '#000' });
      rect(g, x, y + 20, w, 14, { c: 'rgba(255,255,255,.15)' });
      rect(g, x, y + 20 + FH * 0.55, w, FH * 0.3, { c: panel, b: 110, m: rm(0.35, 0.8) });
      g.c.strokeStyle = 'rgba(230,210,160,.45)'; g.c.lineWidth = 2;
      for (let c = 0; c < 3; c++) { // motif chevron
        const cy = y + 20 + FH * 0.6 + c * 16;
        g.c.beginPath(); g.c.moveTo(x + 4, cy + 8); g.c.lineTo(x + w / 2, cy); g.c.lineTo(x + w - 4, cy + 8); g.c.stroke();
      }
    }
    for (let k = 0; k <= piers; k++) rect(g, k * pw - 6, y, 12, FH, { c: shade(stone, 0.12), b: 225 });
    streaks(g, r, y, 16, FH * 0.7);
  }
  return cv;
}

/* ---------- Gotik: jendela lancip, tiang penopang ---------- */
function gothic(o) {
  const { stone = '#cdb88d', glassC = '#2c3742', lit = 0.25, cols = 3 } = o;
  const { cv, g } = layers(TW, TH, 0.75);
  const r = rng(97);
  const cw = TW / cols;
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: stone, b: 150 });
    for (let yy = y; yy < y + FH; yy += 32) rect(g, 0, yy, TW, 2, { c: 'rgba(80,65,40,.25)', b: 105 });
    for (let k = 0; k < cols; k++) {
      const cx = k * cw + cw / 2;
      shape(g, pointedPath(cx, y + 22, y + FH - 30, cw * 0.62), { c: shade(stone, -0.12), b: 110 });
      windowAt(g, r, { cx, top: y + 36, bot: y + FH - 40, w: cw * 0.42, kind: 'pointed', frame: shade(stone, 0.15), glass: glassC, lit, fw: 4 });
    }
    for (let k = 0; k <= cols; k++) { // tiang penopang
      rect(g, k * cw - 9, y, 18, FH, { c: shade(stone, 0.08), b: 225 });
      rect(g, k * cw - 3, y, 6, FH, { c: 'rgba(0,0,0,.12)' });
    }
    rect(g, 0, y + FH - 14, TW, 14, { c: shade(stone, 0.1), b: 210 });
    streaks(g, r, y, 30, FH * 0.8, '50,40,30', 0.16);
  }
  speckle(g.c, 0, 0, TW, TH, 9000, '70,60,40', 0.12, r, 1.5);
  return cv;
}

/* ---------- Mosaik zellige (menara masjid Afrika Utara) ---------- */
function mosaic(o) {
  const { wall = '#efe7da', tileA = '#2f7d6b', tileB = '#e8d9b0', lit = 0.3 } = o;
  const { cv, g } = layers(TW, TH, 0.4);
  const r = rng(101);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: wall, b: 145 });
    const by = y + FH * 0.62, bh = FH * 0.3;
    rect(g, 0, by, TW, bh, { c: tileA, b: 160, m: rm(0.2, 0.1) });
    for (let x = 0; x < TW; x += 32) for (let yy = by; yy < by + bh; yy += 32) { // pola bintang
      g.c.save(); g.c.translate(x + 16, yy + 16); g.c.rotate(Math.PI / 4);
      g.c.fillStyle = tileB; g.c.fillRect(-7, -7, 14, 14); g.c.restore();
      g.c.fillStyle = tileB; g.c.fillRect(x + 9, yy + 9, 14, 14);
      g.c.fillStyle = tileA; g.c.beginPath(); g.c.arc(x + 16, yy + 16, 4, 0, 7); g.c.fill();
    }
    rect(g, 0, by - 6, TW, 6, { c: '#c8b07a', b: 210 }); rect(g, 0, by + bh, TW, 6, { c: '#c8b07a', b: 210 });
    windowAt(g, r, { cx: TW / 4, top: y + FH * 0.14, bot: y + FH * 0.5, w: 46, kind: 'pointed', frame: '#c8b07a', lit, mullion: false });
    windowAt(g, r, { cx: TW * 0.75, top: y + FH * 0.14, bot: y + FH * 0.5, w: 46, kind: 'pointed', frame: '#c8b07a', lit, mullion: false });
  }
  speckle(g.c, 0, 0, TW, TH, 6000, '90,80,60', 0.08, r, 2);
  return cv;
}

/* ---------- Tanah liat / adobe dengan balok kayu menonjol ---------- */
function adobe(o) {
  const { color = '#c79f6e', lit = 0.25 } = o;
  const { cv, g } = layers(TW, TH, 0.95);
  const r = rng(113);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: color, b: 140 });
    speckle(g.c, 0, y, TW, FH, 7000, '90,60,30', 0.15, r, 3);
    speckle(g.b, 0, y, TW, FH, 5000, '60,60,60', 0.35, r, 4);
    for (let x = 20; x < TW; x += 64) rect(g, x, y + 24, 14, 10, { c: '#4a3220', b: 230 }); // ujung balok kayu
    if (f % 2 === 0) {
      const on = r() < lit;
      rect(g, TW * 0.4, y + FH * 0.35, 60, 80, { c: on ? '#e8b66a' : '#2b2018', b: 50, e: on ? '#d9902f' : '#000' });
    }
    streaks(g, r, y, 20, FH, '90,60,35', 0.15);
  }
  return cv;
}

/* ---------- Hutan vertikal: balkon beton penuh tanaman ---------- */
function green(o) {
  const { slab = '#e4e2dc', lit = 0.25 } = o;
  const { cv, g } = layers(TW, TH, 0.85);
  const r = rng(127);
  for (let f = 0; f < NF; f++) {
    const y = bandTop(f);
    rect(g, 0, y, TW, FH, { c: '#2f3a40', b: 90, m: rm(0.1, 0.5) });
    for (let x = 0; x < TW; x += 64) { const on = r() < lit; rect(g, x + 6, y + 30, 52, FH * 0.45, { c: on ? '#e5c48a' : '#3c4b54', e: on ? '#e0a050' : '#000', m: rm(0.08, 0.6), b: 80 }); }
    for (let k = 0; k < 70; k++) { // dedaunan menjuntai dari pot balkon
      const x = r() * TW, yy = y + FH * 0.55 + r() * FH * 0.35, rad = 10 + r() * 22;
      g.c.fillStyle = `hsl(${95 + r() * 40} ${35 + r() * 25}% ${22 + r() * 22}%)`;
      g.c.beginPath(); g.c.arc(x, yy, rad, 0, 7); g.c.fill();
      g.b.fillStyle = gray(160 + r() * 60); g.b.beginPath(); g.b.arc(x, yy, rad, 0, 7); g.b.fill();
      g.m.fillStyle = rm(0.9, 0); g.m.beginPath(); g.m.arc(x, yy, rad, 0, 7); g.m.fill();
    }
    rect(g, 0, y + FH - 26, TW, 26, { c: slab, b: 220, m: rm(0.8, 0) });
  }
  return cv;
}

/* ---------- Kisi beton / baja ---------- */
function lattice(o) {
  const { color = '#e7e3da', core = '#2a3238', cell = 64 } = o;
  const { cv, g } = layers(TW, TH, 0.6);
  const r = rng(131);
  rect(g, 0, 0, TW, TH, { c: core, b: 60, m: rm(0.4, 0.6) });
  for (let y = 0; y < TH; y += 64) for (let x = 0; x < TW; x += 64) {
    const on = r() < 0.12;
    if (on) rect(g, x + 20, y + 20, 24, 24, { c: '#d9b070', e: '#d08a3a' });
  }
  g.c.strokeStyle = color; g.c.lineWidth = 12; g.b.strokeStyle = gray(225); g.b.lineWidth = 12;
  for (const ctx of [g.c, g.b]) {
    for (let k = -TH; k < TW + TH; k += cell) {
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + TH, TH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k + TH, 0); ctx.lineTo(k, TH); ctx.stroke();
    }
  }
  return cv;
}

export const FACADES = { glass, marble, arcade, brick, plaster, concrete, pagoda, stripes, deco, gothic, mosaic, adobe, green, lattice };

/** Ubin atap (UV dunia, 512 px per unit). */
export function drawRoof({ base = [40, 14, 86], joint = '#bdb3a2', tile = 256, rough = 0.6, seed = 5 } = {}) {
  const { cv, g } = layers(512, 512, rough);
  const r = rng(seed);
  for (let y = 0; y < 512; y += tile) for (let x = 0; x < 512; x += tile) {
    rect(g, x, y, tile, tile, { c: `hsl(${base[0]} ${base[1]}% ${base[2] + r() * 6 - 3}%)`, b: 140 });
    rect(g, x, y, tile, 3, { c: joint, b: 80 }); rect(g, x, y, 3, tile, { c: joint, b: 80 });
  }
  speckle(g.c, 0, 0, 512, 512, 4000, '80,70,60', 0.12, r, 1.5);
  return cv;
}
