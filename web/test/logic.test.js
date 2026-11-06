import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDrop, speedFor, metersAt, reviveTitle, canRevive, axisFor, START } from '../src/logic.js';

const top = { x: 0, z: 0, w: 3, d: 3 };

test('meleset total = miss', () => {
  assert.equal(resolveDrop(top, { x: 3, z: 0, w: 3, d: 3 }, 'x', 0).result, 'miss');
  assert.equal(resolveDrop(top, { x: 0, z: -3.2, w: 3, d: 3 }, 'z', 2).result, 'miss');
});

test('pas sempurna tidak memotong', () => {
  const r = resolveDrop(top, { x: 0.1, z: 0, w: 3, d: 3 }, 'x', 0);
  assert.equal(r.result, 'perfect');
  assert.equal(r.block.w, 3);
  assert.equal(r.block.x, 0);
  assert.equal(r.chip, null);
  assert.equal(r.streak, 1);
});

test('3× sempurna melebar, maks ukuran awal', () => {
  const small = { x: 0, z: 0, w: 2, d: 3 };
  const r = resolveDrop(small, { x: 0, z: 0, w: 2, d: 3 }, 'x', 2);
  assert.equal(r.block.w, 2.25);
  assert.ok(r.grew);
  const full = resolveDrop(top, { x: 0, z: 0, w: 3, d: 3 }, 'x', 5);
  assert.equal(full.block.w, START);
  assert.equal(full.grew, false);
});

test('potongan: sisa + chip = ukuran semula', () => {
  const r = resolveDrop(top, { x: 1, z: 0, w: 3, d: 3 }, 'x', 4);
  assert.equal(r.result, 'cut');
  assert.equal(r.streak, 0);
  assert.equal(r.block.w, 2);
  assert.equal(r.block.x, 0.5);
  assert.equal(r.chip.w, 1);
  assert.equal(r.chip.x, 2);
  const l = resolveDrop(top, { x: 0, z: -0.5, w: 3, d: 3 }, 'z', 0);
  assert.equal(l.block.d, 2.5);
  assert.equal(l.block.z, -0.25);
  assert.equal(l.chip.z, -1.75);
});

test('kecepatan naik lalu dibatasi', () => {
  const sp = { base: 3.2, inc: 0.16, max: 9 };
  assert.equal(speedFor(0, sp), 3.2);
  assert.ok(speedFor(10, sp) > speedFor(5, sp));
  assert.equal(speedFor(200, sp), 9);
});

test('sumbu bergantian', () => {
  assert.equal(axisFor(1), 'x');
  assert.equal(axisFor(2), 'z');
});

test('meter dan revive', () => {
  const b = { floors: 20, heightM: 132 };
  assert.equal(metersAt(10, b), 66);
  assert.equal(metersAt(25, b), 132);
  assert.equal(reviveTitle({ floors: 15, target: 20, best: 0 }), 'Hampir sampai puncak!');
  assert.equal(reviveTitle({ floors: 8, target: 20, best: 10 }), 'Hampir pecah rekor!');
  assert.equal(reviveTitle({ floors: 4, target: Infinity, best: 30 }), 'Lanjut membangun?');
  assert.equal(canRevive(2, false), false);
  assert.equal(canRevive(3, false), true);
  assert.equal(canRevive(9, true), false);
});
