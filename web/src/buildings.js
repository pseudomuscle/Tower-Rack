// API bangunan untuk UI & mesin game. Data level ada di levels.js.
import { LEVELS, REGIONS, levelsIn, TIMES } from './levels.js';

export { REGIONS, levelsIn, TIMES };
export const BUILDINGS = LEVELS;

// Mode bebas = gameplay prototipe asli (tanpa target, tema kue lapis).
export const FREE_MODE = {
  id: 'bebas', name: 'Mode Bebas', free: true, floors: Infinity, heightM: 0, style: 'cake', crown: null, lean: 0,
  speed: { base: 3.2, inc: 0.16, max: 9 }, motion: 'linear', start: 3, grow: true,
  sky: ['#f7a072', '#f4c38b', '#ffe7c2'], sun: { color: '#fff1dd', intensity: 2.6, dir: [6, 14, 3] },
  clouds: 0.5, glow: 0, hemi: 0.6, env: 0.75, exposure: 1, groundColor: '#e9d8bd'
};

export const byId = (id) => BUILDINGS.find((b) => b.id === id) || (id === FREE_MODE.id ? FREE_MODE : null);
export const indexOf = (b) => BUILDINGS.findIndex((x) => x.id === b.id);
export const nextBuilding = (b) => BUILDINGS[indexOf(b) + 1] || null;
export const regionOf = (b) => REGIONS.find((r) => r.id === b.region);
export const skyCss = (b) => `linear-gradient(180deg, ${b.sky[0]} 0%, ${b.sky[1]} 50%, ${b.sky[2]} 100%)`;
