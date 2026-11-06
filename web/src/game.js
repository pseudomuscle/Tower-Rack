// Mesin permainan 3D: scene, tumpukan, kamera, dan alur status.
// UI tidak diurus di sini; semua kejadian dikirim lewat `hooks`.
import * as THREE from 'three';
import { H, START, RANGE, axisFor, speedFor, resolveDrop, metersAt, canRevive } from './logic.js';
import { createLook, disposeObject } from './textures.js';
import { buildCrown, buildDecor } from './crowns.js';

const D = 6.2;                 // setengah tinggi pandangan kamera ortografis
const ORBIT_R = 8 * Math.SQRT2;
const COS_E = 0.8165;          // cos sudut elevasi kamera isometrik (≈35°)

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
    stage.prepend(r.domElement);

    const scene = (this.scene = new THREE.Scene());
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 300);
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xfff1dd, 2.3);
    sun.position.set(6, 14, 3);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffc0a0, 0.7);
    fill.position.set(-8, 4, -6);
    scene.add(fill);

    this.tower = new THREE.Group();
    scene.add(this.tower);
    this.env = new THREE.Group();
    scene.add(this.env);

    this.stack = []; this.falling = []; this.fx = [];
    this.cur = null; this.crown = null;
    this.state = 'idle'; this.active = false;
    this.camY = 0; this.lookY = 0; this.zoom = 1; this.angle = Math.PI / 4;

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
    const a = w / h;
    Object.assign(this.camera, { left: -D * a, right: D * a, top: D, bottom: -D });
    this.camera.updateProjectionMatrix();
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    if (on) { this.last = performance.now(); requestAnimationFrame(this.loop); }
  }

  /** Muat bangunan (level) baru. */
  load(b) {
    this.clearTower();
    disposeObject(this.env); this.env.clear();
    if (this.look) this.look.dispose();
    this.b = b;
    this.look = createLook(b);
    this.buildGround(b);
    this.reset();
    this.state = 'ready';
    this.camY = this.stack.length * H; this.lookY = this.camY + 0.6;
    this.zoom = 1; this.angle = Math.PI / 4;
  }

  buildGround(b) {
    if (b.style === 'cake') {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.3, 0.22, 48), new THREE.MeshLambertMaterial({ color: '#fdfaf3' }));
      plate.position.y = -H / 2 - 0.11;
      this.env.add(plate);
      return;
    }
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.0, 0.5, 48), new THREE.MeshLambertMaterial({ color: b.ground }));
    ground.position.y = -H / 2 - 0.25;
    this.env.add(ground);
    const decor = buildDecor(b.decor);
    decor.position.y = -H / 2;
    this.env.add(decor);
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
    const base = { x: 0, z: 0, w: START, d: START };
    base.mesh = this.box(base, 0);
    this.stack.push(base);
  }

  box(b, i) {
    const m = new THREE.Mesh(this.look.geometry(b, i), this.look.materials(i));
    m.position.set(b.x, i * H, b.z);
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
    this.cur = c;
  }

  drop() {
    const top = this.stack[this.stack.length - 1], i = this.stack.length, cur = this.cur;
    const r = resolveDrop(top, cur, this.axis, this.streak);
    if (r.result === 'miss') {
      this.falling.push({ mesh: cur.mesh, vy: 0, spin: (Math.random() - 0.5) * 0.08 });
      this.cur = null; this.streak = 0;
      buzz(60);
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
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
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
    this.crown = buildCrown(this.b.crown, this.stack[i], i, this.look);
    this.crown.scale.setScalar(0.001);
    this.crownT = 0;
    this.tower.add(this.crown);
    buzz([20, 60, 30]);
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
    const ext = (top - bottom) * COS_E + 3.2;
    const tz = Math.min(1.15, (2 * D * frac) / ext);
    this.zoom += (tz - this.zoom) * Math.min(1, dt * 2.5);
    const visibleH = (2 * D) / this.zoom;
    const above = (0.5 - (fromTop + toTop) / 2) * visibleH; // pusat menara di atas tengah layar
    const ly = (top + bottom) / 2 - above / COS_E;
    this.lookY += (ly - this.lookY) * Math.min(1, dt * 2.5);
  }

  loop(now) {
    if (!this.active) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = now / 1000;

    const c = this.cur;
    if (this.state === 'play' && c) {
      c[this.axis] += c.speed * this.dir * dt;
      if (c[this.axis] > RANGE) { c[this.axis] = RANGE; this.dir = -1; }
      if (c[this.axis] < -RANGE) { c[this.axis] = -RANGE; this.dir = 1; }
      c.mesh.position[this.axis] = c[this.axis];
    }
    this.falling = this.falling.filter((f) => {
      f.vy -= 18 * dt;
      f.mesh.position.y += f.vy * dt;
      f.mesh.rotation.x += f.spin; f.mesh.rotation.z += f.spin;
      if (f.mesh.position.y < this.camY - 30) { this.kill(f.mesh); return false; }
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
      this.frameWhole(0.04, 0.5, dt);
    } else if (this.state === 'failed') {
      this.frameWhole(0.1, 0.64, dt);
    } else {
      this.zoom += (1 - this.zoom) * Math.min(1, dt * 3);
      this.lookY += (this.camY + 0.6 - this.lookY) * Math.min(1, dt * 4);
      this.angle += (Math.PI / 4 - this.angle) * Math.min(1, dt * 3);
    }
    const cam = this.camera;
    if (Math.abs(cam.zoom - this.zoom) > 1e-4) { cam.zoom = this.zoom; cam.updateProjectionMatrix(); }
    cam.position.set(Math.cos(this.angle) * ORBIT_R, this.lookY + 8, Math.sin(this.angle) * ORBIT_R);
    cam.lookAt(0, this.lookY, 0);
    this.renderer.render(this.scene, cam);

    if (this.snapAt != null && this.state === 'complete' && this.completeT >= this.snapAt) {
      this.snapAt = null;
      try { this.hooks.onSnapshot?.(this.capture()); } catch (e) { /* snapshot opsional */ }
    }
    requestAnimationFrame(this.loop);
  }

  /** Ambil gambar menara (dipanggil tepat setelah render) untuk album. */
  capture() {
    const src = this.renderer.domElement;
    const W = src.width, Hh = src.height;
    const ch = Math.round(Hh * 0.54), cw = Math.min(W, Math.round(ch * 0.75));
    const out = document.createElement('canvas');
    out.width = 300; out.height = 400;
    const g = out.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 400);
    const s = this.b.sky;
    sky.addColorStop(0, s[0]); sky.addColorStop(0.5, s[1]); sky.addColorStop(1, s[2]);
    g.fillStyle = sky; g.fillRect(0, 0, 300, 400);
    g.drawImage(src, (W - cw) / 2, 0, cw, ch, 0, 0, 300, 400);
    return out.toDataURL('image/jpeg', 0.82);
  }
}
