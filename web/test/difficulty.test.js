import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { TUNED_SPEED } from '../src/tuning.js';
import { winRate, PLAYERS } from '../scripts/difficulty.mjs';

test('semua level punya kecepatan hasil penyetelan', () => {
  for (const l of LEVELS) assert.ok(TUNED_SPEED[l.id], l.name);
});

test('kesulitan naik mulus: tidak ada lonjakan antar level', () => {
  const r = LEVELS.map((l) => winRate(l, PLAYERS.rata2, 250, 11));
  for (let i = 1; i < r.length; i++) {
    // level berikutnya boleh sedikit lebih mudah (acak), tapi tidak boleh jauh lebih sulit
    assert.ok(r[i] >= r[i - 1] - 0.2, `lonjakan di level ${i + 1}: ${(r[i - 1] * 100).toFixed(0)}% → ${(r[i] * 100).toFixed(0)}%`);
  }
  assert.ok(r[0] > 0.95, 'level 1 harus sangat mudah');
  assert.ok(r[59] > 0.03, 'level terakhir harus tetap mungkin diselesaikan');
  assert.ok(r[59] < r[0] - 0.5, 'level terakhir harus jauh lebih sulit dari level 1');
});
