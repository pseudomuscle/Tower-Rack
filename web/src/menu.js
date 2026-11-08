// Menu utama (wilayah & level), lembar detail level, dan Album Koleksi.
import { BUILDINGS, REGIONS, levelsIn, regionOf, skyCss } from './buildings.js';
import { getProgress, isUnlocked, collectedCount, getSnapshot, totalStars, regionStats, nextToPlay } from './progress.js';
import { adStats } from './ads.js';
import { STAR_RULES } from './logic.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmtDate = (ms) => { try { return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
const MOTION = { linear: 'Gerak tetap', ease: 'Gerak bandul', pulse: 'Gerak berirama' };

export function starRow(node, n, max = 3) {
  node.replaceChildren();
  for (let k = 0; k < max; k++) node.append(el('i', k < n ? 'on' : '', '★'));
  node.setAttribute('aria-label', `${n} dari ${max} bintang`);
}
function thumbStyle(node, b, snap) { node.style.backgroundImage = snap ? `url("${snap}")` : skyCss(b); }

export function renderHome(onPlay) {
  const max = BUILDINGS.length * 3;
  $('starTally').textContent = `★ ${totalStars()}/${max}`;
  $('albumCount').textContent = `(${collectedCount()}/${BUILDINGS.length})`;

  const next = nextToPlay(), np = getProgress(next.id);
  $('continueEyebrow').textContent = np.done ? 'Main lagi' : `Lanjutkan · Level ${next.number}`;
  $('continueName').textContent = next.name;
  $('continueMeta').textContent = `${regionOf(next).name} · ${next.floors} lantai · ${next.heightM} m · ${next.difficulty}`;
  $('btnContinue').style.backgroundImage = `linear-gradient(90deg, rgba(20,26,36,.92) 35%, rgba(20,26,36,.35)), ${skyCss(next)}`;
  $('btnContinue').onclick = () => openLevel(next, onPlay);

  const list = $('regionList');
  list.replaceChildren();
  REGIONS.forEach((reg) => {
    const ls = levelsIn(reg.id), st = regionStats(reg.id);
    const open = isUnlocked(ls[0].index);
    const sec = el('section', 'region' + (open ? '' : ' locked'));
    const head = el('header');
    const t = el('div');
    t.append(el('h3', null, reg.name), el('p', null, open ? reg.blurb : `Selesaikan wilayah sebelumnya untuk membuka.`));
    head.append(t, el('span', 'count', `${st.done}/${st.total} · ★${st.stars}`));
    const grid = el('div', 'tiles');
    ls.forEach((l) => {
      const p = getProgress(l.id), unl = isUnlocked(l.index);
      const tile = el('button', 'tile' + (p.done ? ' done' : '') + (unl ? '' : ' locked') + (l.id === next.id ? ' next' : ''));
      tile.type = 'button'; tile.disabled = !unl;
      if (unl) tile.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.55)), ${skyCss(l)}`;
      tile.append(el('b', null, unl ? String(l.number) : '🔒'));
      const s = el('span', 'stars sm'); starRow(s, p.stars); if (unl) tile.append(s);
      tile.setAttribute('aria-label', `Level ${l.number}, ${l.name}${unl ? '' : ', terkunci'}${p.done ? `, ${p.stars} bintang` : ''}`);
      tile.onclick = () => unl && openLevel(l, onPlay);
      grid.append(tile);
    });
    sec.append(head, grid);
    list.append(sec);
  });
  renderAdStats();
}

export function openLevel(l, onPlay) {
  const p = getProgress(l.id), reg = regionOf(l);
  const snap = p.done ? getSnapshot(l.id) : null;
  thumbStyle($('lvThumb'), l, snap);
  $('lvEyebrow').textContent = `${reg.name} · Level ${l.number}`;
  $('lvName').textContent = l.name;
  $('lvInsp').textContent = l.inspiration;
  const chips = $('lvChips'); chips.replaceChildren();
  [[l.difficulty, 'pill ' + l.difficulty], [`${l.floors} lantai`, 'pill'], [`${l.heightM} m`, 'pill'], [l.timeLabel, 'pill'], [MOTION[l.motion], 'pill'],
    ...(l.start < 3 ? [['Lantai sempit', 'pill']] : []), ...(l.grow ? [] : [['Tanpa pelebaran', 'pill']])]
    .forEach(([t, c]) => chips.append(el('span', c, t)));
  starRow($('lvStars'), p.stars);
  $('lvHint').textContent = p.done
    ? `Rekor: ${p.bestPerfects}× pas sempurna. Bintang 2 butuh ${Math.ceil(STAR_RULES[0] * l.floors)}× pas, bintang 3 butuh ${Math.ceil(STAR_RULES[1] * l.floors)}×.`
    : p.best ? `Rekor: lantai ${p.best} dari ${l.floors}.` : `Bintang 2 butuh ${Math.ceil(STAR_RULES[0] * l.floors)}× pas sempurna, bintang 3 butuh ${Math.ceil(STAR_RULES[1] * l.floors)}×.`;
  $('lvPlay').textContent = p.done ? 'Bangun lagi' : 'Bangun';
  const modal = $('levelSheet');
  modal.hidden = false;
  $('lvPlay').onclick = () => { modal.hidden = true; onPlay(l); };
  $('lvClose').onclick = () => { modal.hidden = true; };
  modal.onclick = (e) => { if (e.target === modal) modal.hidden = true; };
  $('lvPlay').focus();
}

export function renderAdStats() {
  const s = adStats();
  $('sPlays').textContent = s.plays;
  $('sOffered').textContent = s.offered;
  $('sRate').textContent = s.offered ? Math.round((s.accepted / s.offered) * 100) + '%' : '–';
}

export function renderAlbum(onPlay) {
  const n = collectedCount();
  $('albumSummary').textContent = n
    ? `${n} dari ${BUILDINGS.length} menara terkumpul`
    : 'Belum ada menara. Selesaikan satu bangunan untuk mengisi album.';
  const root = $('albumGrid');
  root.replaceChildren();
  REGIONS.forEach((reg) => {
    const st = regionStats(reg.id);
    const sec = el('section', 'album-region');
    sec.append(el('h3', null, `${reg.name} · ${st.done}/${st.total}`));
    const grid = el('div', 'album-grid');
    levelsIn(reg.id).forEach((b) => {
      const p = getProgress(b.id);
      const card = el(p.done ? 'button' : 'div', 'card' + (p.done ? '' : ' locked'));
      const img = el('div', 'img', p.done ? '' : '?');
      if (p.done) { card.type = 'button'; thumbStyle(img, b, getSnapshot(b.id)); }
      const s = el('span', 'stars sm'); starRow(s, p.stars);
      card.append(img, el('b', null, p.done ? b.name : `Level ${b.number}`), p.done ? s : el('span', null, 'Belum dibangun'));
      if (p.done) card.onclick = () => openDetail(b, onPlay);
      grid.append(card);
    });
    sec.append(grid);
    root.append(sec);
  });
}

function openDetail(b, onPlay) {
  const p = getProgress(b.id);
  thumbStyle($('detailImg'), b, getSnapshot(b.id));
  $('detailEyebrow').textContent = b.inspiration;
  $('detailName').textContent = b.name;
  const bits = [`${b.heightM} m · ${b.floors} lantai`, `★ ${p.stars}/3`];
  if (p.completedAt) bits.push(`Selesai ${fmtDate(p.completedAt)}`);
  bits.push(`${p.clears}× selesai dari ${p.attempts} percobaan`);
  if (p.bestPerfects) bits.push(`Terbaik ${p.bestPerfects}× pas sempurna`);
  $('detailMeta').textContent = bits.join(' · ');
  $('detailFact').textContent = b.fact;
  const modal = $('albumDetail');
  modal.hidden = false;
  $('detailPlay').onclick = () => { modal.hidden = true; onPlay(b); };
  $('detailClose').onclick = () => { modal.hidden = true; };
  modal.onclick = (e) => { if (e.target === modal) modal.hidden = true; };
  $('detailClose').focus();
}
