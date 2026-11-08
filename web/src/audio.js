// Musik & efek suara, semuanya disintesis dengan Web Audio (tanpa file suara
// dari luar, jadi aman lisensinya). Audio baru boleh berbunyi setelah pemain
// menyentuh layar, jadi konteks dibuat/dilanjutkan pada sentuhan pertama.
import { store } from './storage.js';

const SET_KEY = 'audio';
const settings = { music: true, sfx: true, ...store.get(SET_KEY, {}) };
const saveSettings = () => store.set(SET_KEY, { music: settings.music, sfx: settings.sfx });

let ctx = null, master, sfxBus, musicBus, noiseBuf;
const MUSIC_VOL = 0.38, SFX_VOL = 0.6;

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master = ctx.createGain(); master.gain.value = 1.0;
  master.connect(comp); comp.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sfx ? SFX_VOL : 0; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = settings.music ? MUSIC_VOL : 0; musicBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
/** Panggil dari sentuhan pemain. */
export function unlock() {
  if (!init()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  music.ensure();
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
});

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const now = () => ctx.currentTime;

/** Satu nada dengan selubung attack/decay. */
function tone(freq, { t = now(), dur = 0.3, type = 'sine', gain = 0.3, attack = 0.005, glide = 0, bus = sfxBus, filter = 0, detune = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
  node.connect(g); g.connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}
/** Semburan derau tersaring (ketukan, desis, wusss). */
function noise({ t = now(), dur = 0.1, gain = 0.3, type = 'lowpass', freq = 1200, to = 0, q = 1, bus = sfxBus } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
/** Lonceng: dua parsial tidak harmonis memberi kesan logam. */
function bell(freq, t = now(), gain = 0.22, dur = 1.2) {
  tone(freq, { t, dur, gain, attack: 0.003 });
  tone(freq * 2.76, { t, dur: dur * 0.5, gain: gain * 0.35, attack: 0.002 });
  tone(freq * 5.4, { t, dur: dur * 0.25, gain: gain * 0.12, attack: 0.002 });
}
const ok = () => ctx && ctx.state === 'running' && settings.sfx;

/* ---------- Efek suara ---------- */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const sfx = {
  place() { // lantai mendarat: "tok" kayu/batu
    if (!ok()) return;
    tone(150, { dur: 0.16, gain: 0.5, glide: 0.55 });
    noise({ dur: 0.05, gain: 0.25, freq: 2200 });
  },
  cut() { // potongan terlepas
    if (!ok()) return;
    this.place();
    noise({ dur: 0.09, gain: 0.22, type: 'highpass', freq: 2500, t: now() + 0.02 });
    tone(90, { dur: 0.2, gain: 0.25, glide: 0.6, t: now() + 0.03 });
  },
  perfect(streak = 1) { // pas sempurna: lonceng yang naik nadanya
    if (!ok()) return;
    this.place();
    const n = 72 + PENTA[Math.min(PENTA.length - 1, streak - 1)];
    bell(midi(n), now() + 0.01, 0.2);
  },
  grow() { // lantai melebar: gemerincing naik
    if (!ok()) return;
    [0, 4, 7, 12].forEach((s, k) => bell(midi(84 + s), now() + 0.06 + k * 0.06, 0.1, 0.6));
  },
  miss() { // meleset: wusss jatuh
    if (!ok()) return;
    noise({ dur: 0.7, gain: 0.3, type: 'bandpass', freq: 1800, to: 200, q: 2 });
    tone(220, { dur: 0.6, gain: 0.18, type: 'triangle', glide: 0.35 });
    tone(70, { t: now() + 0.55, dur: 0.35, gain: 0.45, glide: 0.6 });
    noise({ t: now() + 0.55, dur: 0.25, gain: 0.3, freq: 600 });
  },
  fail() { // nada sedih menurun
    if (!ok()) return;
    [67, 63, 60].forEach((n, k) => tone(midi(n), { t: now() + k * 0.22, dur: 0.5, type: 'triangle', gain: 0.22, filter: 1800 }));
    tone(midi(48), { t: now() + 0.66, dur: 1.2, type: 'sine', gain: 0.2 });
  },
  complete() { // fanfare menara selesai
    if (!ok()) return;
    const t = now();
    [60, 64, 67, 72].forEach((n, k) => tone(midi(n), { t: t + k * 0.11, dur: 0.5, type: 'triangle', gain: 0.25, filter: 3000 }));
    [60, 64, 67, 71, 74].forEach((n) => {
      tone(midi(n), { t: t + 0.5, dur: 1.8, type: 'sawtooth', gain: 0.06, attack: 0.08, filter: 2200 });
      tone(midi(n), { t: t + 0.5, dur: 1.8, type: 'triangle', gain: 0.1, attack: 0.05, detune: 6 });
    });
    tone(midi(36), { t: t + 0.5, dur: 1.6, gain: 0.3 });
    [84, 88, 91, 96].forEach((n, k) => bell(midi(n), t + 0.55 + k * 0.08, 0.08, 1.4));
    noise({ t: t + 0.5, dur: 1.2, gain: 0.08, type: 'highpass', freq: 6000 });
  },
  star(i = 0) { // tiap bintang muncul
    if (!ok()) return;
    bell(midi(79 + [0, 4, 7][i % 3]), now(), 0.18, 0.9);
  },
  click() {
    if (!ok()) return;
    tone(1200, { dur: 0.04, gain: 0.12, type: 'square', filter: 3000 });
  },
  coin() { // hadiah iklan diterima
    if (!ok()) return;
    tone(midi(83), { dur: 0.1, gain: 0.18, type: 'square', filter: 4000 });
    tone(midi(88), { t: now() + 0.08, dur: 0.4, gain: 0.18, type: 'square', filter: 4000 });
  },
  start() { // mulai membangun
    if (!ok()) return;
    noise({ dur: 0.35, gain: 0.12, type: 'bandpass', freq: 400, to: 2400, q: 1.5 });
  }
};

/* ---------- Musik latar ---------- */
// Tiap suasana: tempo, nada dasar, 4 akor (1 birama per akor, semiton dari dasar),
// tangga nada arpeggio, dan warna suara.
const MOODS = {
  menu: { bpm: 72, root: 60, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 7]], lead: 'bell', arp: [0, 2, 1, 3, 2, 1, 3, 2], sparse: 0.55 },
  nusantara: { bpm: 84, root: 62, chords: [[0, 7, 12], [2, 9, 14], [-3, 4, 9], [0, 7, 14]], scale: [0, 2, 4, 7, 9], lead: 'gamelan', arp: [0, 2, 1, 3, 4, 3, 2, 1], sparse: 0.75 },
  asia: { bpm: 76, root: 64, chords: [[0, 7, 12], [-2, 5, 12], [-5, 2, 9], [0, 5, 12]], scale: [0, 2, 5, 7, 9], lead: 'koto', arp: [0, 1, 2, 4, 3, 2, 1, 0], sparse: 0.6 },
  eropa: { bpm: 88, root: 60, chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], lead: 'harpsi', arp: [0, 1, 2, 3, 2, 1, 2, 1], sparse: 0.9 },
  timur: { bpm: 82, root: 62, chords: [[0, 4, 7], [1, 5, 8], [0, 4, 7], [-2, 1, 5]], scale: [0, 1, 4, 5, 7, 8, 10], lead: 'oud', arp: [0, 1, 2, 3, 4, 3, 2, 1], sparse: 0.7 },
  amerika: { bpm: 92, root: 60, chords: [[2, 5, 9, 12], [-5, -1, 4, 5], [0, 4, 7, 11], [-3, 1, 4, 7]], lead: 'epiano', arp: [0, 2, 3, 1, 2, 3, 0, 2], sparse: 0.6 },
  dunia: { bpm: 100, root: 57, chords: [[0, 3, 7], [-4, 0, 3], [-9, -5, 0], [-2, 2, 5]], lead: 'synth', arp: [0, 1, 2, 1, 3, 1, 2, 1], sparse: 0.95 }
};

function leadNote(kind, freq, t, dur) {
  if (kind === 'gamelan') { bell(freq, t, 0.12, dur * 3); return; }
  if (kind === 'bell') { bell(freq, t, 0.08, dur * 3); return; }
  const o = { t, bus: musicBus };
  if (kind === 'koto') tone(freq, { ...o, dur: dur * 2.2, type: 'triangle', gain: 0.22, glide: 0.995 });
  else if (kind === 'harpsi') tone(freq, { ...o, dur: dur * 1.6, type: 'sawtooth', gain: 0.09, filter: 2600 });
  else if (kind === 'oud') { tone(freq * 1.01, { ...o, dur: dur * 1.8, type: 'triangle', gain: 0.2, glide: 0.99 }); }
  else if (kind === 'epiano') { tone(freq, { ...o, dur: dur * 2.5, gain: 0.2 }); tone(freq * 2, { ...o, dur: dur, gain: 0.05 }); }
  else tone(freq, { ...o, dur: dur * 1.2, type: 'sawtooth', gain: 0.08, filter: 1800 });
}
function pad(notes, t, dur, warm) {
  notes.forEach((n, k) => {
    [-7, 7].forEach((det) => tone(midi(n), { t, dur, type: 'triangle', gain: 0.045, attack: dur * 0.35, bus: musicBus, detune: det + k, filter: warm ? 900 : 1500 }));
  });
}

const music = {
  mood: 'menu', next: null, step: 0, nextTime: 0, timer: 0, seed: 1,
  ensure() {
    if (!ctx || this.timer) return;
    this.nextTime = now() + 0.1;
    this.timer = setInterval(() => this.tick(), 100);
  },
  set(mood, immediate = false) {
    if (!MOODS[mood]) mood = 'menu';
    if (immediate) { this.mood = mood; this.next = null; this.step = 0; return; }
    if (mood === this.mood && !this.next) return;
    this.next = mood; // ganti di awal frase berikutnya supaya mulus
  },
  rand() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; },
  tick() {
    if (!ctx || ctx.state !== 'running' || !settings.music) { if (ctx) this.nextTime = now() + 0.1; return; }
    while (this.nextTime < now() + 0.3) { this.schedule(this.step, this.nextTime); this.advance(); }
  },
  advance() {
    const m = MOODS[this.mood];
    this.nextTime += 60 / m.bpm / 2; // per seperdelapan
    this.step++;
    if (this.step % 32 === 0 && this.next) { this.mood = this.next; this.next = null; this.step = 0; }
  },
  schedule(step, t) {
    const m = MOODS[this.mood];
    const eighth = 60 / m.bpm / 2, bar = eighth * 8;
    const chord = m.chords[Math.floor(step / 8) % m.chords.length].map((s) => s + m.root);
    if (step % 8 === 0) {
      pad(chord, t, bar * 1.05, this.mood === 'menu' || this.mood === 'asia');
      tone(midi(chord[0] - 24), { t, dur: eighth * 3, gain: 0.32, bus: musicBus, filter: 400 });
    }
    if (step % 8 === 4) tone(midi(chord[0] - 24 + (this.mood === 'amerika' ? 7 : 0)), { t, dur: eighth * 2.5, gain: 0.25, bus: musicBus, filter: 400 });
    if (this.mood === 'dunia' && step % 2 === 0) noise({ t, dur: 0.04, gain: 0.05, type: 'highpass', freq: 7000, bus: musicBus });
    if (this.rand() > m.sparse) return; // beri ruang kosong supaya tidak ramai
    const idx = m.arp[step % 8];
    let n;
    if (m.scale && this.rand() < 0.35) n = m.root + 12 + m.scale[Math.floor(this.rand() * m.scale.length)];
    else n = chord[idx % chord.length] + 12 * (1 + Math.floor(idx / chord.length));
    leadNote(m.lead, midi(n), t, eighth);
  },
  duck(level = 0.3, sec = 2.5) {
    if (!ctx || !settings.music) return;
    const g = musicBus.gain, t = now();
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * level, t + 0.15);
    g.linearRampToValueAtTime(MUSIC_VOL, t + sec);
  }
};

export const setMusicMood = (mood, immediate) => music.set(mood, immediate);
/** Untuk uji otomatis: sadap keluaran audio sebagai MediaStream. */
export function _tapOutput() { if (!init()) return null; const d = ctx.createMediaStreamDestination(); master.connect(d); return d.stream; }
export const duckMusic = (level, sec) => music.duck(level, sec);

/* ---------- Pengaturan ---------- */
export const audioSettings = () => ({ ...settings });
export function setMusic(on) {
  settings.music = on; saveSettings();
  if (ctx) musicBus.gain.setTargetAtTime(on ? MUSIC_VOL : 0, now(), 0.2);
}
export function setSfx(on) {
  settings.sfx = on; saveSettings();
  if (ctx) sfxBus.gain.setTargetAtTime(on ? SFX_VOL : 0, now(), 0.05);
}
