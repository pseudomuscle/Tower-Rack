import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-700.css';
import './style.css';

import { Game } from './game.js';
import { BUILDINGS, FREE_MODE, nextBuilding, skyCss } from './buildings.js';
import { getProgress, recordAttempt, recordResult, saveSnapshot } from './progress.js';
import { offerReward, track, resetAdStats, adOpen } from './ads.js';
import { metersAt, reviveTitle } from './logic.js';
import { renderHome, renderAlbum, renderAdStats } from './menu.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
let current = null;      // bangunan yang sedang dimainkan
let bestAtStart = 0;     // rekor sebelum permainan ini (untuk judul revive)
let streakTimer = 0;

/* ---------- Navigasi layar ---------- */
const setHudCompact = (on) => $('hud').classList.toggle('compact', on);

function show(name) {
  if (game && name !== 'play') game.flushSnapshot();
  $('home').hidden = name !== 'home';
  $('album').hidden = name !== 'album';
  $('hud').hidden = name !== 'play';
  if (name !== 'play') { $('doneSheet').hidden = true; $('failSheet').hidden = true; $('cover').hidden = true; }
  game && game.setActive(name === 'play');
  if (name === 'home') renderHome(play);
  if (name === 'album') renderAlbum(play);
}

/* ---------- HUD ---------- */
function hud(info) {
  const b = info.building;
  $('hudFloor').textContent = info.floors;
  if (b.free) {
    $('hudSub').textContent = 'Rekor ' + Math.max(bestAtStart, info.floors);
    $('hudBarWrap').hidden = true;
  } else {
    $('hudSub').textContent = `${info.meters} m / ${b.heightM} m`;
    $('hudBarWrap').hidden = false;
    $('hudBar').style.width = Math.min(100, (info.floors / b.floors) * 100) + '%';
  }
}
function showStreak(info) {
  const s = $('streak');
  if (!info.perfect) { s.classList.remove('on'); return; }
  s.textContent = info.grew ? 'Melebar!' : info.streak >= 2 ? 'Pas ×' + info.streak : 'Pas!';
  s.classList.add('on');
  clearTimeout(streakTimer);
  streakTimer = setTimeout(() => s.classList.remove('on'), 700);
}
function cover(title, text) {
  $('coverTitle').textContent = title;
  $('coverText').textContent = text;
  $('cover').hidden = false;
}

/* ---------- Mulai level ---------- */
function play(b) {
  current = b;
  bestAtStart = getProgress(b.id).best;
  $('doneSheet').hidden = true; $('failSheet').hidden = true;
  setHudCompact(false);
  stage.style.background = skyCss(b);
  game.load(b);
  hud(game.info());
  if (b.free) cover('Mode Bebas', 'Ketuk untuk mulai. Tumpuk setinggi mungkin.');
  else cover(b.name, `Ketuk untuk mulai. Target ${b.floors} lantai (${b.heightM} m).`);
  show('play');
}

function retry() {
  $('failSheet').hidden = true; $('doneSheet').hidden = true;
  setHudCompact(false);
  bestAtStart = getProgress(current.id).best;
  game.restart();
}

/* ---------- Kejadian dari mesin game ---------- */
const hooks = {
  onStart(info) {
    $('cover').hidden = true;
    recordAttempt(info.building.id);
    hud(info);
  },
  onFloor(info) { hud(info); showStreak(info); },
  onMiss(info) {
    const b = info.building;
    const title = reviveTitle({ floors: info.floors, target: info.target, best: bestAtStart });
    const where = b.free
      ? `Skor ${info.floors}${bestAtStart ? ', rekor ' + bestAtStart : ''}.`
      : `Lantai ${info.floors} dari ${b.floors} (${info.meters} m).`;
    return offerReward({ title, text: where + ' Tonton iklan untuk mengulang lantai terakhir.' });
  },
  onFail(info) {
    const b = info.building;
    setHudCompact(true);
    track('plays');
    const { newBest } = recordResult(b.id, { floors: info.floors, completed: false, perfects: info.perfects });
    const best = getProgress(b.id).best;
    if (b.free) {
      $('failEyebrow').textContent = newBest ? 'Rekor baru!' : 'Permainan selesai';
      $('failTitle').textContent = `Skor ${info.floors}`;
      $('failMeta').textContent = `Rekor ${best}`;
      $('failRetry').textContent = 'Main lagi';
      $('failMenu').textContent = 'Menu';
    } else {
      $('failEyebrow').textContent = newBest ? 'Rekor baru untuk bangunan ini' : 'Menara runtuh';
      $('failTitle').textContent = `Berhenti di lantai ${info.floors}`;
      $('failMeta').textContent = `${info.meters} m dari ${b.heightM} m · tersisa ${b.floors - info.floors} lantai · rekor ${best}`;
      $('failRetry').textContent = 'Coba lagi';
      $('failMenu').textContent = 'Pilih bangunan';
    }
    $('failSheet').hidden = false;
    $('failRetry').focus();
  },
  onComplete(info) {
    const b = info.building;
    setHudCompact(true);
    track('plays');
    const { firstClear } = recordResult(b.id, { floors: info.floors, completed: true, perfects: info.perfects });
    $('doneName').textContent = b.name;
    $('doneMeta').textContent = `${metersAt(b.floors, b)} m · ${b.floors} lantai · ${info.perfects}× pas sempurna`;
    $('doneNew').hidden = !firstClear;
    $('doneFact').textContent = b.fact;
    const next = nextBuilding(b);
    const nextBtn = $('doneNext');
    if (next) {
      nextBtn.textContent = (firstClear ? 'Terbuka: ' : 'Lanjut: ') + next.name + ' ›';
      nextBtn.onclick = () => play(next);
    } else {
      nextBtn.textContent = 'Lihat Album Koleksi';
      nextBtn.onclick = () => show('album');
    }
    $('doneSheet').hidden = false;
    nextBtn.focus();
  },
  onSnapshot(url, b) { if (b && !b.free) saveSnapshot(b.id, url); }
};

/* ---------- Tombol ---------- */
$('btnBack').addEventListener('pointerdown', (e) => e.stopPropagation());
$('btnBack').onclick = () => show('home');
$('btnAlbum').onclick = () => show('album');
$('albumBack').onclick = () => show('home');
$('btnFree').onclick = () => play(FREE_MODE);
$('failRetry').onclick = retry;
$('failMenu').onclick = () => show('home');
$('doneAgain').onclick = retry;
$('doneAlbum').onclick = () => show('album');
$('doneMenu').onclick = () => show('home');
$('resetStats').onclick = () => { resetAdStats(); renderAdStats(); };

stage.addEventListener('pointerdown', (e) => {
  if (adOpen() || $('hud').hidden) return;
  if (e.target.closest('button')) return;
  e.preventDefault();
  game.tap();
});
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || adOpen() || $('hud').hidden) return;
  if (!$('doneSheet').hidden || !$('failSheet').hidden) return;
  e.preventDefault();
  game.tap();
});

/* ---------- Mulai ---------- */
let game = null;
try {
  game = new Game(stage, hooks);
} catch (err) {
  $('levelList').innerHTML = '<p class="note">Mesin 3D tidak bisa dijalankan di perangkat ini (WebGL tidak tersedia).</p>';
}
show('home');

// Untuk uji otomatis/debug di konsol.
window.__menara = { get game() { return game; }, play, show, BUILDINGS };
