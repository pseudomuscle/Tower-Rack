// Mesin permainan 3D: scene, tumpukan, kamera, dan alur status.
// UI tidak diurus di sini; semua kejadian dikirim lewat `hooks`.
import * as THREE from 'three';
import { H, START, RANGE, axisFor, speedFor, resolveDrop, metersAt, canRevive, advance, starsFor } from './logic.js';
import { createLook, disposeObject } from './textures.js';
import { buildCrown } from './crowns.js';
import { buildScenery, makeEnvironment, buildSky } from './scenery.js';

// Kamera perspektif seperti foto: lensa 50°, sedikit menunduk, sehingga
// cakrawala dan langit terlihat di bagian atas layar.
const FOV = 50;
const TAN = Math.tan((FOV / 2) * Math.PI / 180);
const PITCH = 15 * Math.PI / 180;
const COS_P = Math.cos(PITCH), SIN_P = Math.sin(PITCH);
const VIEW_HALF = 6.4;             // setengah tinggi pandangan saat bermain (unit dunia)
const PLAY_DIST = VIEW_HALF / TAN;

const easeOutBack = (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* abaikan */ } };

export class Game {
  /**
   * hooks: onStart(), onFloor(info), onMiss(info) → Promise<boolean revive>,
   *        onFail(info), onComplete(info), onSnapshot(dataUrl)
   */
  constructor(stage, hooks) {
    this.stage = stage;
    this.hooks = hooks;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.prepend(r.domElement);

    const scene = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2500);
    scene.fog = new THREE.Fog(0xffffff, 40, 300);
    this.hemi = new THREE.HemisphereLight(0xdfefff, 0x6b6b60, 0.6);
    scene.add(this.hemi);
    const sun = (this.sun = new THREE.DirectionalLight(0xfff1dd, 3));
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    this.sunDir = new THREE.Vector3(6, 14, 3).normalize();
    this.shadowHalf = 0;
    // Pita layar (porsi dari atas) tempat menara dibingkai saat selesai/gagal.
    // Batas bawah disesuaikan dengan tinggi lembar hasil lewat setFrameBottom().
    this.band = { complete: [0.04, 0.5], failed: [0.1, 0.64] };

    this.tower = new THREE.Group();
    scene.add(this.tower);
    this.env = new THREE.Group();
    scene.add(this.env);

    this.stack = []; this.falling = []; this.fx = [];
    this.cur = null; this.crown = null;
    this.state = 'idle'; this.active = false;
    this.camY = 0; this.lookY = 0; this.dist = PLAY_DIST; this.angle = Math.PI / 4;

    this.loop = this.loop.bind(this);
    new ResizeObserver(() => this.resize()).observe(stage);
    this.resize();
  }

  get score() { return Math.max(0, this.stack.length - 1); }

  info() {
    const b = this.b;
    return {
      building: b,
      floors: this.score,
      target: b.floors,
      meters: metersAt(this.score, b),
      perfects: this.perfects,
      stars: starsFor(this.perfects, this.score),
      streak: this.streak,
      revived: this.revived,
      canRevive: canRevive(this.score, this.revived),
      state: this.state
    };
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    if (on) { this.last = performance.now(); requestAnimationFrame(this.loop); }
  }

  /** Muat bangunan (level) baru. */
  load(b) {
    this.flushSnapshot();
    this.clearTower();
    disposeObject(this.env); this.env.clear();
    if (this.look) this.look.dispose();
    if (this.envRT) this.envRT.dispose();
    if (this.sky) { this.scene.remove(this.sky); disposeObject(this.sky); }
    this.b = b;
    this.look = createLook(b);
    this.env.add(buildScenery(b));
    this.envRT = makeEnvironment(this.renderer, b);
    this.sky = buildSky(b);
    this.scene.add(this.sky);
    this.scene.fog.color.set(b.sky[2]);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = b.env ?? 0.75;
    this.hemi.intensity = b.hemi ?? 0.6;
    this.renderer.toneMappingExposure = b.exposure ?? 1;
    this.sun.color.set(b.sun.color);
    this.sun.intensity = b.sun.intensity;
    this.sunDir.set(...b.sun.dir).normalize();
    this.hemi.color.set(b.sky[1]);
    this.hemi.groundColor.set(b.groundColor || '#8a7a60');
    this.reset();
    this.state = 'ready';
    this.camY = this.stack.length * H; this.lookY = this.camY + 0.6;
    this.dist = PLAY_DIST; this.angle = Math.PI / 4;
  }

  clearTower() {
    [...this.stack.map((s) => s.mesh), ...this.falling.map((f) => f.mesh), ...this.fx.map((f) => f.mesh)]
      .forEach((m) => this.kill(m));
    if (this.cur) this.kill(this.cur.mesh);
    if (this.crown) this.kill(this.crown);
    this.stack = []; this.falling = []; this.fx = []; this.cur = null; this.crown = null;
    this.tower.rotation.set(0, 0, 0);
  }

  reset() {
    this.clearTower();
    this.streak = 0; this.perfects = 0; this.revived = false;
    this.snapAt = null; this.completeT = 0;
    const st = this.b.start || START;
    const base = { x: 0, z: 0, w: st, d: st };
    base.mesh = this.box(base, 0);
    this.stack.push(base);
  }

  box(b, i) {
    const m = new THREE.Mesh(this.look.geometry(b, i), this.look.materials(i));
    m.position.set(b.x, i * H, b.z);
    m.castShadow = true; m.receiveShadow = true;
    this.look.decorate(m, b, i);
    this.tower.add(m);
    return m;
  }

  kill(m) { if (m.parent) m.parent.remove(m); disposeObject(m); }

  /** Ketukan pemain. */
  tap() {
    if (this.state === 'ready') return this.start();
    if (this.state === 'play' && this.cur) this.drop();
  }

  start() {
    if (this.state !== 'ready') this.reset();
    this.state = 'play';
    this.hooks.onStart?.(this.info());
    this.spawn();
  }

  /** Ulangi level yang sama dari awal. */
  restart() {
    this.flushSnapshot();
    this.reset();
    this.state = 'ready';
    this.start();
  }

  spawn() {
    const top = this.stack[this.stack.length - 1], i = this.stack.length;
    this.axis = axisFor(i); this.dir = 1;
    const c = { x: top.x, z: top.z, w: top.w, d: top.d };
    c[this.axis] = -RANGE;
    c.mesh = this.box(c, i);
    c.speed = speedFor(i, this.b.speed);
    c.phase = 0;
    this.cur = c;
  }

  drop() {
    const top = this.stack[this.stack.length - 1], i = this.stack.length, cur = this.cur;
    const r = resolveDrop(top, cur, this.axis, this.streak, this.b.start || START, this.b.grow !== false);
    if (r.result === 'miss') {
      this.falling.push({ mesh: cur.mesh, vy: 0, spin: (Math.random() - 0.5) * 0.08 });
      this.cur = null; this.streak = 0;
      buzz(60);
      this.hooks.onDropMiss?.();
      return this.missed();
    }
    this.streak = r.streak;
    if (r.result === 'perfect') { this.perfects++; buzz(15); }
    if (r.chip) this.falling.push({ mesh: this.box(r.chip, i), vy: 0, spin: (Math.random() - 0.5) * 0.06 });
    this.kill(cur.mesh); this.cur = null;
    const b = r.block;
    b.mesh = this.box(b, i);
    this.stack.push(b);
    if (r.result === 'perfect') this.perfectFx(b, i);
    this.hooks.onFloor?.({ ...this.info(), perfect: r.result === 'perfect', grew: r.grew });
    if (this.score >= this.b.floors) return this.complete();
    this.spawn();
  }

  perfectFx(b, i) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w + 0.5, b.d + 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(b.x, i * H + H / 2 + 0.01, b.z);
    this.tower.add(m);
    this.fx.push({ mesh: m, t: 0 });
  }

  missed() {
    this.state = 'over';
    const info = this.info();
    if (!info.canRevive) { setTimeout(() => this.fail(), 350); return; }
    setTimeout(async () => {
      let ok = false;
      try { ok = await this.hooks.onMiss?.(info); } catch (e) { ok = false; }
      if (this.state !== 'over') return; // pemain sudah keluar
      if (ok) { this.revived = true; this.state = 'play'; this.spawn(); }
      else this.fail();
    }, 450);
  }

  fail() {
    if (this.state !== 'over') return;
    this.state = 'failed';
    this.hooks.onFail?.(this.info());
  }

  complete() {
    this.state = 'complete';
    this.completeT = 0;
    const i = this.stack.length - 1;
    this.crown = buildCrown(this.b.crown, this.stack[i], i, this.look, this.b.crownOpts);
    this.crown.scale.setScalar(0.001);
    this.crownT = 0;
    this.tower.add(this.crown);
    buzz([20, 60, 30]);
    this.hooks.onTopped?.(this.info());
    this.snapAt = 2.2;
    setTimeout(() => { if (this.state === 'complete') this.hooks.onComplete?.(this.info()); }, 1100);
  }

  /**
   * Bingkai kamera agar seluruh menara muat di pita layar antara `fromTop` dan `toTop`
   * (porsi tinggi layar dari atas, 0..1), di atas lembar hasil.
   */
  frameWhole(fromTop, toTop, dt) {
    const frac = toTop - fromTop;
    const crownH = this.crown ? this.crown.userData.height * this.crown.scale.y : 0;
    const top = (this.stack.length - 1) * H + H / 2 + crownH;
    const bottom = -H / 2 - 0.5;
    const ext = (top - bottom) * COS_P + 4.5 * SIN_P + 1.2;
    const td = Math.max(PLAY_DIST * 0.85, ext / (frac * 2 * TAN));
    const k = Math.min(1, dt * 2.5);
    this.dist += (td - this.dist) * k;
    const visibleH = 2 * this.dist * TAN;
    const above = (0.5 - (fromTop + toTop) / 2) * visibleH; // pusat menara di atas tengah layar
    const ly = (top + bottom) / 2 - above / COS_P;
    this.lookY += (ly - this.lookY) * k;
  }

  placeCamera() {
    const cam = this.camera, d = this.dist;
    cam.position.set(Math.cos(this.angle) * COS_P * d, this.lookY + SIN_P * d, Math.sin(this.angle) * COS_P * d);
    cam.lookAt(0, this.lookY, 0);
    const f = this.scene.fog;
    f.near = d + 18; f.far = d + 260;
    if (this.sky) this.sky.position.copy(cam.position);
  }

  loop(now) {
    if (!this.active) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = now / 1000;

    const c = this.cur;
    if (this.state === 'play' && c) {
      const m = advance(c.phase, c.speed, dt, this.b.motion || 'linear', t);
      c.phase = m.phase; c[this.axis] = m.pos;
      c.mesh.position[this.axis] = m.pos;
    }
    this.falling = this.falling.filter((f) => {
      f.vy -= 18 * dt;
      f.mesh.position.y += f.vy * dt;
      f.mesh.rotation.x += f.spin; f.mesh.rotation.z += f.spin;
      if (f.mesh.position.y < -3) { this.kill(f.mesh); return false; }
      return true;
    });
    this.fx = this.fx.filter((f) => {
      f.t += dt;
      f.mesh.material.opacity = Math.max(0, 0.8 - f.t * 1.6);
      f.mesh.scale.setScalar(1 + f.t * 0.6);
      if (f.t > 0.5) { this.kill(f.mesh); return false; }
      return true;
    });

    if (this.crown) {
      this.crownT += dt;
      const k = Math.min(1, this.crownT / 0.7);
      this.crown.scale.setScalar(Math.max(0.001, easeOutBack(k)));
      this.crown.userData.tick?.(t);
    }

    this.camY += (this.stack.length * H - this.camY) * Math.min(1, dt * 4);
    if (this.state === 'complete') {
      this.completeT += dt;
      const lean = this.b.lean || 0;
      this.tower.rotation.z += (-lean - this.tower.rotation.z) * Math.min(1, dt * 1.2);
      this.angle += dt * 0.22;
      this.frameWhole(...this.band.complete, dt);
    } else if (this.state === 'failed') {
      this.frameWhole(...this.band.failed, dt);
    } else {
      this.dist += (PLAY_DIST - this.dist) * Math.min(1, dt * 3);
      this.lookY += (this.camY + 0.6 - this.lookY) * Math.min(1, dt * 4);
      this.angle += (Math.PI / 4 - this.angle) * Math.min(1, dt * 3);
    }
    this.updateShadow();
    this.placeCamera();
    this.renderer.render(this.scene, this.camera);

    if (this.snapAt != null && this.state === 'complete' && this.completeT >= this.snapAt) {
      this.snapAt = null;
      try { this.hooks.onSnapshot?.(this.capture(), this.b); } catch (e) { /* snapshot opsional */ }
    }
    requestAnimationFrame(this.loop);
  }

  /**
   * Kalau pemain meninggalkan layar selesai sebelum foto album diambil,
   * selesaikan animasi seketika lalu ambil fotonya sekarang.
   */
  flushSnapshot() {
    if (this.state !== 'complete' || this.snapAt == null) return;
    this.snapAt = null;
    if (this.crown) this.crown.scale.setScalar(1);
    this.tower.rotation.z = -(this.b.lean || 0);
    this.angle = Math.PI / 4 + 0.5;
    this.frameWhole(...this.band.complete, 1);
    this.placeCamera();
    this.updateShadow();
    this.renderer.render(this.scene, this.camera);
    try { this.hooks.onSnapshot?.(this.capture(), this.b); } catch (e) { /* snapshot opsional */ }
  }

  /**
   * Atur batas bawah area bingkai (porsi tinggi layar dari atas) sesuai posisi
   * lembar hasil, supaya menara tidak tertutup di layar yang lebih pendek.
   */
  setFrameBottom(kind, frac) {
    const top = kind === 'failed' ? 0.08 : 0.04;
    this.band[kind] = [top, Math.max(top + 0.22, Math.min(0.92, frac))];
  }

  /** Kotak bayangan matahari mengikuti bagian menara yang sedang terlihat. */
  updateShadow() {
    const whole = this.state === 'complete' || this.state === 'failed';
    const topY = this.stack.length * H;
    const half = whole ? Math.max(8, topY / 2 + 4) : 8;
    const cy = whole ? topY / 2 : Math.max(0, this.lookY - 1);
    const sun = this.sun, cam = sun.shadow.camera;
    sun.target.position.set(0, cy, 0);
    sun.position.copy(this.sunDir).multiplyScalar(half + 20).add(sun.target.position);
    if (half !== this.shadowHalf) {
      this.shadowHalf = half;
      Object.assign(cam, { left: -half, right: half, top: half, bottom: -half, near: 0.5, far: half * 2 + 45 });
      cam.updateProjectionMatrix();
    }
  }

  /** Ambil gambar menara (dipanggil tepat setelah render) untuk album. */
  capture() {
    const src = this.renderer.domElement;
    const W = src.width, Hh = src.height;
    const ch = Math.round(Hh * Math.min(0.9, this.band.complete[1] + 0.04)), cw = Math.min(W, Math.round(ch * 0.75));
    const out = document.createElement('canvas');
    out.width = 240; out.height = 320;
    const g = out.getContext('2d');
    g.drawImage(src, (W - cw) / 2, 0, cw, ch, 0, 0, 240, 320);
    return out.toDataURL('image/jpeg', 0.75);
  }
}
