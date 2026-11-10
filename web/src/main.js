import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-700.css';
import './style.css';

import { Game } from './game.js';
import { BUILDINGS, FREE_MODE, nextBuilding, skyCss } from './buildings.js';
import { getProgress, recordAttempt, recordResult, saveSnapshot } from './progress.js';
import { offerReward, track, resetAdStats, adOpen } from './ads.js';
import { metersAt, reviveTitle, STAR_RULES } from './logic.js';
import { renderHome, renderAlbum, renderAdStats, starRow } from './menu.js';
import { sfx, setMusicMood, duckMusic, audioSettings, setMusic, setSfx, _tapOutput } from './audio.js';
import { initAds, onBackButton } from './native.js';
import { graphicsSetting, setGraphics, effectiveQuality } from './quality.js';
import { initPremium, isPremium, premiumAvailable, premiumPrice, buyPremium, restorePremium, onPremiumChange } from './premium.js';

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
  if (name !== 'play') setMusicMood('menu');
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
  setMusicMood(b.free ? 'menu' : b.region);
  hud(game.info());
  if (b.free) cover('Mode Bebas', 'Ketuk untuk mulai. Tumpuk setinggi mungkin.');
  else cover(`${b.number}. ${b.name}`, `Ketuk untuk mulai. Target ${b.floors} lantai (${b.heightM} m).${b.motion === 'ease' ? ' Lantai bergerak seperti bandul.' : b.motion === 'pulse' ? ' Kecepatan lantai naik-turun.' : ''}`);
  show('play');
}

function retry() {
  $('failSheet').hidden = true; $('doneSheet').hidden = true;
  setHudCompact(false);
  bestAtStart = getProgress(current.id).best;
  game.restart();
}

/** Bingkai menara di ruang kosong di atas lembar hasil (tinggi lembar beda di tiap HP). */
function fitFrame(kind, sheetId) {
  const sheet = $(sheetId).querySelector('.sheet');
  const h = stage.clientHeight;
  if (!sheet || !h) return;
  game.setFrameBottom(kind, (sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top) / h - 0.02);
}

/* ---------- Kejadian dari mesin game ---------- */
const hooks = {
  onStart(info) {
    sfx.start();
    $('cover').hidden = true;
    recordAttempt(info.building.id);
    hud(info);
  },
  onFloor(info) {
    hud(info); showStreak(info);
    if (info.perfect) { sfx.perfect(info.streak); if (info.grew) sfx.grow(); } else sfx.cut();
  },
  onDropMiss() { sfx.miss(); },
  onTopped() { duckMusic(0.25, 4); sfx.complete(); },
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
    duckMusic(0.3, 3); sfx.fail();
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
      $('failMenu').textContent = 'Menu';
    }
    $('failSheet').hidden = false;
    fitFrame('failed', 'failSheet'); setTimeout(() => fitFrame('failed', 'failSheet'), 400); // ukur lagi setelah animasi muncul
    $('failRetry').focus();
  },
  onComplete(info) {
    const b = info.building;
    setHudCompact(true);
    track('plays');
    const { firstClear, newStars } = recordResult(b.id, { floors: info.floors, completed: true, perfects: info.perfects, stars: info.stars });
    starRow($('doneStars'), info.stars);
    for (let k = 0; k < info.stars; k++) setTimeout(() => sfx.star(k), 120 + k * 150); // selaras animasi bintang
    $('doneHint').textContent = info.stars < 3
      ? `Dapatkan ${Math.ceil(STAR_RULES[info.stars === 1 ? 0 : 1] * b.floors)}× pas sempurna untuk bintang ${info.stars + 1}.`
      : newStars ? 'Bintang penuh!' : '';
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
    fitFrame('complete', 'doneSheet'); setTimeout(() => fitFrame('complete', 'doneSheet'), 400); // ukur lagi setelah animasi muncul
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

/* ---------- Suara ---------- */
function renderSound() {
  const a = audioSettings();
  $('btnMusic').textContent = a.music ? '♪ Musik: nyala' : '♪ Musik: mati';
  $('btnSfx').textContent = a.sfx ? '🔊 Efek: nyala' : '🔈 Efek: mati';
  $('btnMusic').setAttribute('aria-pressed', a.music);
  $('btnSfx').setAttribute('aria-pressed', a.sfx);
  const muted = !a.music && !a.sfx;
  $('btnMute').textContent = muted ? '🔇' : '🔊';
  $('btnMute').setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
}
$('btnMusic').onclick = () => { setMusic(!audioSettings().music); renderSound(); };
$('btnSfx').onclick = () => { setSfx(!audioSettings().sfx); renderSound(); };
$('btnMute').addEventListener('pointerdown', (e) => e.stopPropagation());
$('btnMute').onclick = () => { const a = audioSettings(); const on = !a.music && !a.sfx; setMusic(on); setSfx(on); renderSound(); };
renderSound();

/* ---------- Grafis ---------- */
const GFX_NEXT = { auto: 'high', high: 'low', low: 'auto' };
function renderGraphics() {
  const s = graphicsSetting(), eff = effectiveQuality() === 'low' ? 'Hemat' : 'Tinggi';
  $('btnGraphics').textContent = s === 'auto' ? `🖼 Grafis: Otomatis (${eff})` : `🖼 Grafis: ${eff}`;
}
$('btnGraphics').onclick = () => { setGraphics(GFX_NEXT[graphicsSetting()]); renderGraphics(); };
renderGraphics();
// bunyi klik untuk tombol menu (bukan ketukan permainan)
document.addEventListener('click', (e) => { if (e.target.closest('.btn, .tile, .continue, .card, .icon-btn')) sfx.click(); });

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
  $('regionList').innerHTML = '<p class="note">Mesin 3D tidak bisa dijalankan di perangkat ini (WebGL tidak tersedia).</p>';
}
show('home');
initAds();

/* ---------- Premium "Hapus iklan" (hanya di aplikasi Android) ---------- */
function renderPremium(note) {
  const box = $('premiumBox');
  box.hidden = !premiumAvailable();
  if (box.hidden) return;
  const owned = isPremium();
  box.classList.toggle('owned', owned);
  $('premiumTitle').textContent = owned ? '★ Premium aktif' : 'Hapus iklan';
  $('premiumText').textContent = note || (owned ? 'Terima kasih! Revive sekarang langsung, tanpa iklan.' : 'Sekali beli: revive langsung tanpa menonton iklan, selamanya.');
  $('btnPremium').hidden = owned;
  $('btnRestore').hidden = owned;
  $('btnPremium').textContent = premiumPrice() ? `Beli ${premiumPrice()}` : 'Beli';
}
$('btnPremium').onclick = async () => {
  $('btnPremium').disabled = true;
  const r = await buyPremium();
  $('btnPremium').disabled = false;
  if (r === 'ok') sfx.coin();
  renderPremium(r === 'pending' ? 'Pembayaran sedang diproses. Premium aktif otomatis setelah selesai.'
    : r === 'error' ? 'Pembelian belum berhasil. Coba lagi nanti.' : undefined);
};
$('btnRestore').onclick = async () => {
  const owned = await restorePremium();
  renderPremium(owned ? undefined : 'Belum ada pembelian Premium di akun Google Play ini.');
};
onPremiumChange(() => renderPremium());
initPremium().then(() => renderPremium());

// Tombol kembali Android: tutup lembar yang terbuka → kembali ke menu → keluar aplikasi.
onBackButton(() => {
  if (adOpen()) return true; // jangan ganggu saat iklan ditawarkan
  for (const id of ['levelSheet', 'albumDetail']) if (!$(id).hidden) { $(id).hidden = true; return true; }
  if (!$('home').hidden) return false;
  show('home');
  return true;
});

// Untuk uji otomatis/debug di konsol.
window.__menara = { get game() { return game; }, play, show, BUILDINGS, audio: { sfx, setMusicMood, tap: _tapOutput } };
