// Menu utama (pilih bangunan) dan Album Koleksi.
import { BUILDINGS, skyCss } from './buildings.js';
import { getProgress, isUnlocked, collectedCount, getSnapshot } from './progress.js';
import { adStats } from './ads.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmtDate = (ms) => { try { return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };

function thumbStyle(node, b, snap) {
  node.style.backgroundImage = snap ? `url("${snap}")` : skyCss(b);
}

export function renderHome(onPlay) {
  const list = $('levelList');
  list.replaceChildren();
  BUILDINGS.forEach((b, i) => {
    const p = getProgress(b.id), open = isUnlocked(i);
    const btn = el('button', 'level');
    btn.type = 'button';
    btn.disabled = !open;
    const thumb = el('div', 'thumb', p.done ? '' : open ? String(i + 1) : '🔒');
    thumbStyle(thumb, b, p.done ? getSnapshot(b.id) : null);
    const info = el('div');
    info.append(el('h3', null, b.name), el('div', 'sub', b.inspiration));
    const line = el('div', 'line');
    line.append(el('span', 'pill ' + b.difficulty, b.difficulty), el('span', null, `${b.floors} lantai · ${b.heightM} m`));
    if (p.done) line.append(el('span', 'pill done', '✓ Selesai'));
    info.append(line);
    if (open && !p.done && p.best > 0) {
      const bar = el('div', 'bar'); const fill = el('i');
      fill.style.width = Math.min(100, (p.best / b.floors) * 100) + '%';
      bar.append(fill); info.append(bar);
      info.append(el('div', 'sub', `Rekor: lantai ${p.best} dari ${b.floors}`));
    }
    if (!open) info.append(el('div', 'sub', `Selesaikan ${BUILDINGS[i - 1].name} untuk membuka`));
    btn.append(thumb, info);
    btn.setAttribute('aria-label', `${b.name}, ${b.difficulty}, ${b.floors} lantai${p.done ? ', selesai' : ''}${open ? '' : ', terkunci'}`);
    btn.onclick = () => open && onPlay(b);
    list.append(btn);
  });
  $('albumCount').textContent = `(${collectedCount()}/${BUILDINGS.length})`;
  renderAdStats();
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
  const grid = $('albumGrid');
  grid.replaceChildren();
  BUILDINGS.forEach((b) => {
    const p = getProgress(b.id);
    const card = el(p.done ? 'button' : 'div', 'card' + (p.done ? '' : ' locked'));
    const img = el('div', 'img', p.done ? '' : '?');
    if (p.done) { card.type = 'button'; thumbStyle(img, b, getSnapshot(b.id)); }
    card.append(img, el('b', null, b.name), el('span', null, p.done ? `${b.heightM} m · ${b.floors} lantai` : 'Belum dibangun'));
    if (p.done) card.onclick = () => openDetail(b, onPlay);
    grid.append(card);
  });
}

function openDetail(b, onPlay) {
  const p = getProgress(b.id);
  thumbStyle($('detailImg'), b, getSnapshot(b.id));
  $('detailEyebrow').textContent = b.inspiration;
  $('detailName').textContent = b.name;
  const bits = [`${b.heightM} m · ${b.floors} lantai`];
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
