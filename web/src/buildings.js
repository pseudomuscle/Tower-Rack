// Data level. Nama samaran & model buatan sendiri — hanya "terinspirasi",
// bukan salinan bangunan nyata. Atur keseimbangan level di file ini saja.

export const BUILDINGS = [
  {
    id: 'tugu-emas',
    name: 'Tugu Emas Jakarta',
    inspiration: 'Terinspirasi tugu nasional di Jakarta',
    difficulty: 'Mudah',
    floors: 20,
    heightM: 132,
    style: 'marble',
    crown: 'flame',
    lean: 0,
    speed: { base: 2.6, inc: 0.08, max: 5.5 },
    sky: ['#5fb0e6', '#a7daf3', '#fff2d9'],
    plinth: 'cawan',
    scenery: 'park',
    groundColor: '#5f8f3e',
    sun: { color: '#fff4e2', intensity: 3.2, dir: [5, 12, 3] },
    fact: 'Monumen Nasional di Jakarta tingginya sekitar 132 meter. Puncaknya berupa lidah api perunggu yang dilapisi emas.'
  },
  {
    id: 'menara-miring',
    name: 'Menara Miring',
    inspiration: 'Terinspirasi menara lonceng di Pisa, Italia',
    difficulty: 'Sedang',
    floors: 30,
    heightM: 56,
    style: 'stone',
    crown: 'belfry',
    lean: 0.07,
    speed: { base: 3.0, inc: 0.12, max: 7 },
    sky: ['#f3a56f', '#f8d29c', '#fff0d6'],
    plinth: 'round',
    scenery: 'piazza',
    groundColor: '#73a843',
    sun: { color: '#ffe0b5', intensity: 3.0, dir: [7, 8, 1.5] },
    fact: 'Menara lonceng di Pisa mulai miring saat masih dibangun pada abad ke-12 karena tanahnya lunak. Butuh hampir 200 tahun sampai menara itu selesai.'
  },
  {
    id: 'kaca-gurun',
    name: 'Menara Kaca Gurun',
    inspiration: 'Terinspirasi pencakar langit meruncing di kota gurun',
    difficulty: 'Sulit',
    floors: 60,
    heightM: 800,
    style: 'glass',
    crown: 'spire',
    lean: 0,
    speed: { base: 3.2, inc: 0.16, max: 9 },
    sky: ['#2d6bb3', '#86b9e2', '#f2dcb4'],
    plinth: 'podium',
    scenery: 'city',
    groundColor: '#d7b47c',
    sun: { color: '#ffe3bd', intensity: 3.0, dir: [8, 7, -1.5] },
    fact: 'Pencakar langit di gurun memakai kaca berlapis yang memantulkan panas matahari, dan dibuat meruncing supaya lebih tahan angin kencang.'
  }
];

// Mode bebas = gameplay prototipe asli (tanpa target, tema kue lapis).
export const FREE_MODE = {
  id: 'bebas',
  name: 'Mode Bebas',
  free: true,
  floors: Infinity,
  heightM: 0,
  style: 'cake',
  crown: null,
  lean: 0,
  speed: { base: 3.2, inc: 0.16, max: 9 },
  sky: ['#f7a072', '#f4c38b', '#ffe7c2'],
  sun: { color: '#fff1dd', intensity: 2.6, dir: [6, 14, 3] }
};

export const byId = (id) => BUILDINGS.find((b) => b.id === id) || (id === FREE_MODE.id ? FREE_MODE : null);
export const indexOf = (b) => BUILDINGS.findIndex((x) => x.id === b.id);
export const nextBuilding = (b) => BUILDINGS[indexOf(b) + 1] || null;
export const skyCss = (b) => `linear-gradient(180deg, ${b.sky[0]} 0%, ${b.sky[1]} 50%, ${b.sky[2]} 100%)`;
