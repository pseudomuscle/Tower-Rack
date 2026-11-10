// 60 level di 6 wilayah. Nama bangunan samaran & model buatan sendiri —
// hanya "terinspirasi" bangunan nyata. Atur keseimbangan level di file ini.
//
// Kecepatan tiap level dihitung dari urutannya (sama untuk semua pemain),
// dan bisa ditimpa per level lewat `speed`, `start`, `motion`, `grow`.

/* ---------- Waktu & cuaca ---------- */
export const TIMES = {
  day: { label: 'Siang', sky: ['#3a7fd0', '#86bdea', '#e4edf2'], sun: { color: '#fff4e2', intensity: 3.2, dir: [5, 12, 3] }, glow: 0.25, cityGlow: 0, clouds: 0.55, hemi: 0.6, env: 0.75, exposure: 1 },
  morning: { label: 'Pagi', sky: ['#4a86c8', '#a6c8e6', '#f6dfc4'], sun: { color: '#ffe6c4', intensity: 2.8, dir: [8, 6, 5] }, glow: 0.25, cityGlow: 0, clouds: 0.45, hemi: 0.6, env: 0.75, exposure: 1 },
  golden: { label: 'Sore', sky: ['#4f7fbf', '#e9b98a', '#ffd3a0'], sun: { color: '#ffc98c', intensity: 3.0, dir: [8, 4.5, 1] }, glow: 0.4, cityGlow: 0.2, clouds: 0.5, hemi: 0.55, env: 0.7, exposure: 1 },
  dusk: { label: 'Senja', sky: ['#25335f', '#b56882', '#f19a68'], sun: { color: '#ff9860', intensity: 2.0, dir: [9, 1.8, -2] }, glow: 1.4, cityGlow: 0.8, clouds: 0.5, hemi: 0.45, env: 0.55, exposure: 1.05 },
  night: { label: 'Malam', sky: ['#050a1a', '#0f1d3d', '#24385c'], sun: { color: '#a9bdff', intensity: 0.7, dir: [-4, 10, 6] }, glow: 2.4, cityGlow: 1.3, clouds: 0.25, cloudColor: '#3b4866', stars: true, night: true, hemi: 0.25, env: 0.35, exposure: 1.15 },
  winter: { label: 'Musim dingin', sky: ['#6a8db5', '#b9cde0', '#e6ecf2'], sun: { color: '#fff4e6', intensity: 2.5, dir: [6, 6, 3] }, glow: 0.3, cityGlow: 0.2, clouds: 0.7, snow: true, hemi: 0.7, env: 0.8, exposure: 1 }
};

const GROUND = { park: '#5f8f3e', piazza: '#73a843', desert: '#d7b47c', downtown: '#7d7f82', oldtown: '#8f877a', garden: '#5c8d3f', harbor: '#8f8c86' };

export const REGIONS = [
  { id: 'nusantara', name: 'Nusantara', blurb: 'Tugu, menara jam, mercusuar, dan pencakar langit Indonesia.' },
  { id: 'asia', name: 'Asia', blurb: 'Pagoda, menara TV, dan gedung kaca kota-kota Asia.' },
  { id: 'eropa', name: 'Eropa', blurb: 'Menara lonceng, katedral gotik, dan menara jam tua.' },
  { id: 'timur', name: 'Timur Tengah & Afrika', blurb: 'Obelisk, menara masjid, dan menara kaca di gurun.' },
  { id: 'amerika', name: 'Amerika', blurb: 'Tugu batu, gedung art deco, dan menara pemancar.' },
  { id: 'dunia', name: 'Puncak Dunia', blurb: 'Gedung-gedung tertinggi dan paling berani di dunia.' }
];

import { TUNED_SPEED } from './tuning.js';

// Singkatan fasad
const glass = (o = {}) => ({ style: 'glass', ...o });
const F = (style, o = {}) => ({ style, ...o });

/* ---------- Daftar level ---------- */
// [wilayah, id, nama, inspirasi, fakta, pengaturan]
const RAW = [
  // ============ Nusantara ============
  ['nusantara', 'tugu-emas', 'Tugu Emas Jakarta', 'Terinspirasi tugu nasional di Jakarta',
    'Monumen Nasional di Jakarta tingginya sekitar 132 meter. Puncaknya berupa lidah api perunggu yang dilapisi emas.',
    { facade: F('marble'), crown: 'flame', plinth: 'cawan', scenery: 'park', time: 'day', floors: 15, height: 132 }],
  ['nusantara', 'jam-ngarai', 'Menara Jam Ngarai', 'Terinspirasi menara jam di Bukittinggi',
    'Jam Gadang di Bukittinggi dibangun tahun 1926. Angka empat pada jamnya ditulis "IIII", bukan "IV".',
    { facade: F('plaster', { wall: '#f3efe6', trim: '#b9a27a', win: 'arch', cols: 2 }), crown: 'clock', crownOpts: { roof: 'gonjong', body: 'white', trim: 'stone' }, plinth: 'square', scenery: 'park', time: 'morning', floors: 16, height: 26, trees: 'round' }],
  ['nusantara', 'mercusuar-barat', 'Mercusuar Pantai Barat', 'Terinspirasi mercusuar di pesisir Anyer',
    'Mercusuar di Anyer, Banten, dibangun pada 1885 untuk menggantikan mercusuar lama yang hancur akibat letusan Krakatau tahun 1883.',
    { facade: F('stripes', { a: '#f4f1ea', b: '#ebe6dc' }), round: true, crown: 'lantern', crownOpts: { cap: 'black' }, plinth: 'rock', scenery: 'harbor', time: 'golden', floors: 18, height: 75, trees: 'palm' }],
  ['nusantara', 'menara-kudus', 'Menara Bata Kudus', 'Terinspirasi menara masjid kuno di Kudus',
    'Menara Masjid Kudus di Jawa Tengah terbuat dari bata merah dan bentuknya mirip candi, perpaduan budaya Hindu-Jawa dan Islam.',
    { facade: F('brick', { color: '#a5523a', trim: '#c79a72', win: 'none' }), crown: 'pagoda', crownOpts: { roofColor: 'terracotta', wall: '#8f4632' }, plinth: 'temple', scenery: 'oldtown', time: 'golden', floors: 17, height: 18 }],
  ['nusantara', 'pagoda-tujuh', 'Pagoda Tujuh Tingkat', 'Terinspirasi pagoda di Semarang',
    'Pagoda Avalokitesvara di Semarang setinggi sekitar 45 meter dan memiliki tujuh tingkat.',
    { facade: F('pagoda', { wall: '#b3352b' }), ledge: 'eave', ledgeColor: '#2f6b4f', crown: 'pagoda', crownOpts: { roofColor: 'green' }, plinth: 'temple', scenery: 'garden', time: 'morning', floors: 18, height: 45, roofColor: '#2f6b4f' }],
  ['nusantara', 'menara-istana', 'Menara Kubah Putih', 'Terinspirasi menara masjid besar di Jakarta',
    'Menara Masjid Istiqlal di Jakarta tingginya 66,66 meter.',
    { facade: F('marble', { hue: 45, sat: 8, light: 92 }), round: true, crown: 'minaret', crownOpts: { body: 'white', cap: 'steel' }, plinth: 'square', scenery: 'park', time: 'day', floors: 20, height: 67 }],
  ['nusantara', 'menara-air', 'Menara Air Kolonial', 'Terinspirasi menara air zaman Belanda',
    'Menara air zaman kolonial dibangun tinggi agar air bisa mengalir ke rumah-rumah hanya dengan gaya gravitasi.',
    { facade: F('brick', { color: '#8e3e2c', win: 'arch', cols: 2 }), round: true, crown: 'tank', crownOpts: { color: 'stone', roofColor: 'slate' }, plinth: 'square', scenery: 'oldtown', time: 'day', floors: 20, height: 40 }],
  ['nusantara', 'menara-pemancar', 'Menara Pemancar Kota', 'Terinspirasi menara telekomunikasi di Jakarta',
    'Menara pemancar dibuat sangat tinggi supaya sinyal televisi dan radio bisa menjangkau wilayah luas tanpa terhalang gedung.',
    { facade: F('concrete', { color: '#dcd8d0', ribbon: false }), round: true, crown: 'antenna', crownOpts: { pod: 'disc', body: 'white' }, plinth: 'square', scenery: 'downtown', time: 'golden', floors: 22, height: 120 }],
  ['nusantara', 'gedung-thamrin', 'Gedung Kaca Thamrin', 'Terinspirasi gedung perkantoran di pusat Jakarta',
    'Gedung tinggi di daerah rawan gempa seperti Jakarta dirancang dengan struktur yang lentur, sehingga bisa bergoyang tanpa patah.',
    { facade: glass({ hue: 200, light: 52 }), crown: 'helipad', plinth: 'podium', scenery: 'downtown', time: 'dusk', floors: 24, height: 210 }],
  ['nusantara', 'pencakar-ibukota', 'Pencakar Langit Ibu Kota', 'Terinspirasi gedung tertinggi di Indonesia',
    'Gedung tertinggi di Indonesia saat ini tingginya lebih dari 380 meter dan berada di Jakarta.',
    { facade: glass({ hue: 210, sat: 18, light: 62, alu: '#d6dbe0' }), crown: 'deco', crownOpts: { color: 'white', mast: 1.8 }, plinth: 'podium', scenery: 'downtown', time: 'night', floors: 26, height: 383 }],

  // ============ Asia ============
  ['asia', 'pagoda-kyoto', 'Pagoda Lima Atap', 'Terinspirasi pagoda kayu di Kyoto',
    'Pagoda kuil Tō-ji di Kyoto setinggi sekitar 55 meter dan menjadi pagoda kayu tertinggi di Jepang.',
    { facade: F('pagoda', { wall: '#6b3b26', pillar: '#2e1c12', screen: '#e9dcc0' }), ledge: 'eave', ledgeColor: '#3b3e44', crown: 'pagoda', plinth: 'temple', scenery: 'garden', time: 'morning', floors: 22, height: 55 }],
  ['asia', 'menara-bambu', 'Menara Ruas Bambu', 'Terinspirasi pencakar langit di Taipei',
    'Pencakar langit di Taipei punya bandul baja raksasa seberat sekitar 660 ton di dekat puncaknya untuk meredam goyangan angin dan gempa.',
    { facade: glass({ hue: 165, sat: 30, light: 48, alu: '#9fb5ae' }), crown: 'spire', crownOpts: { tiers: [0.7, 0.5], needle: 1.4 }, plinth: 'podium', scenery: 'downtown', time: 'day', floors: 24, height: 508 }],
  ['asia', 'menara-perak', 'Menara Kembar Perak', 'Terinspirasi menara kembar di Kuala Lumpur',
    'Menara kembar di Kuala Lumpur pernah menjadi gedung tertinggi di dunia dari 1998 sampai 2004.',
    { facade: glass({ hue: 210, sat: 10, light: 68, cols: 6, alu: '#e4e8ec', spandrel: '#9aa4ab' }), round: true, crown: 'spire', crownOpts: { tiers: [0.75, 0.55, 0.38], needle: 1.6 }, plinth: 'podium', scenery: 'downtown', time: 'night', floors: 26, height: 452 }],
  ['asia', 'mutiara-timur', 'Menara Mutiara Timur', 'Terinspirasi menara TV di Shanghai',
    'Menara TV di Shanghai punya bola-bola besar berwarna merah muda, terinspirasi puisi kuno tentang mutiara yang jatuh di piring giok.',
    { facade: F('concrete', { color: '#e2dcd6' }), round: true, crown: 'antenna', crownOpts: { pod: 'ball', podColor: 'red', mast: 1.6 }, plinth: 'square', scenery: 'harbor', time: 'dusk', floors: 24, height: 468 }],
  ['asia', 'prang-fajar', 'Prang Kuil Fajar', 'Terinspirasi menara kuil di tepi sungai Bangkok',
    'Menara utama Wat Arun di Bangkok dihiasi pecahan porselen berwarna-warni.',
    { facade: F('mosaic', { wall: '#ece4d4', tileA: '#3d7fb0', tileB: '#e7c66a' }), crown: 'prang', plinth: 'temple', scenery: 'harbor', time: 'golden', floors: 24, height: 80, trees: 'palm' }],
  ['asia', 'menara-gunung', 'Menara Puncak Gunung', 'Terinspirasi menara di Gunung Namsan, Seoul',
    'Menara di puncak Gunung Namsan, Seoul, terkenal dengan ribuan gembok cinta yang dipasang para pengunjung.',
    { facade: F('concrete', { color: '#e9e7e2' }), round: true, crown: 'antenna', crownOpts: { pod: 'disc', mast: 2.2 }, plinth: 'rock', scenery: 'park', time: 'night', floors: 26, height: 236, trees: 'pine' }],
  ['asia', 'jam-pelabuhan', 'Menara Jam Pelabuhan', 'Terinspirasi menara jam tua di Hong Kong',
    'Menara jam tua di tepi pelabuhan Hong Kong adalah sisa stasiun kereta yang dibongkar pada 1970-an.',
    { facade: F('brick', { color: '#a64b37', trim: '#e6dcc8', win: 'arch', cols: 2 }), crown: 'clock', crownOpts: { roof: 'dome', roofColor: 'slate', body: 'stone' }, plinth: 'square', scenery: 'harbor', time: 'day', floors: 26, height: 44 }],
  ['asia', 'kaca-teluk', 'Menara Kaca Teluk', 'Terinspirasi gedung tinggi di Singapura',
    'Gedung di Singapura dibatasi tingginya sekitar 280 meter karena berdekatan dengan jalur penerbangan.',
    { facade: glass({ hue: 195, sat: 40, light: 56 }), crown: 'helipad', plinth: 'podium', scenery: 'harbor', time: 'dusk', floors: 28, height: 280 }],
  ['asia', 'menara-teratai', 'Menara Teratai', 'Terinspirasi menara pemancar di Kolombo',
    'Menara Teratai di Kolombo, Sri Lanka, tingginya sekitar 350 meter dan puncaknya berbentuk kuncup bunga teratai.',
    { facade: F('concrete', { color: '#a9c7a2', vlines: true }), round: true, crown: 'lotus', crownOpts: { color: '#d68fb0' }, plinth: 'square', scenery: 'park', time: 'night', floors: 28, height: 350, trees: 'palm' }],
  ['asia', 'menara-pilin', 'Pencakar Langit Pilin', 'Terinspirasi pencakar langit di Shanghai',
    'Pencakar langit di Shanghai tingginya 632 meter, dan bentuknya memutar sekitar 120 derajat dari bawah ke atas untuk mengurangi beban angin.',
    { facade: glass({ hue: 200, sat: 22, light: 62, alu: '#cfd7dd' }), round: true, crown: 'spire', crownOpts: { tiers: [0.7, 0.45], needle: 1.2 }, plinth: 'podium', scenery: 'harbor', time: 'day', floors: 30, height: 632 }],

  // ============ Eropa ============
  ['eropa', 'menara-miring', 'Menara Miring', 'Terinspirasi menara lonceng di Pisa, Italia',
    'Menara lonceng di Pisa mulai miring saat masih dibangun pada abad ke-12 karena tanahnya lunak. Butuh hampir 200 tahun sampai menara itu selesai.',
    { facade: F('arcade'), round: true, crown: 'belfry', plinth: 'round', scenery: 'piazza', time: 'golden', floors: 26, height: 56, lean: 0.07 }],
  ['eropa', 'jam-sungai', 'Menara Jam Tepi Sungai', 'Terinspirasi menara jam di London',
    'Nama terkenal menara jam di London sebenarnya adalah nama lonceng besarnya, bukan nama menaranya.',
    { facade: F('gothic', { stone: '#d4bf8f' }), crown: 'clock', crownOpts: { roof: 'spire', body: 'stone', roofColor: 'slate', lit: true }, plinth: 'square', scenery: 'oldtown', time: 'dusk', floors: 28, height: 96 }],
  ['eropa', 'lonceng-kanal', 'Menara Lonceng Kanal', 'Terinspirasi menara lonceng di Venesia',
    'Menara lonceng di alun-alun utama Venesia runtuh pada 1902, lalu dibangun ulang persis seperti aslinya dan selesai pada 1912.',
    { facade: F('brick', { color: '#b0583c', win: 'none' }), crown: 'clock', crownOpts: { roof: 'spire', roofColor: 'green', body: 'white' }, plinth: 'square', scenery: 'harbor', time: 'morning', floors: 28, height: 99, houseRoofs: true }],
  ['eropa', 'katedral-kembar', 'Katedral Menara Kembar', 'Terinspirasi katedral gotik di Köln',
    'Katedral di Köln, Jerman, dibangun selama lebih dari 600 tahun, dari 1248 sampai 1880.',
    { facade: F('gothic', { stone: '#7b746a', cols: 3 }), crown: 'gothic', crownOpts: { color: 'black', height: 2.0 }, plinth: 'square', scenery: 'oldtown', time: 'day', floors: 30, height: 157 }],
  ['eropa', 'benteng-merah', 'Menara Benteng Merah', 'Terinspirasi menara benteng di Moskwa',
    'Menara utama benteng di Moskwa punya jam besar dan bintang merah di puncaknya.',
    { facade: F('brick', { color: '#b4372b', trim: '#efe7da', win: 'arch', cols: 2 }), crown: 'clock', crownOpts: { roof: 'star', body: 'red' }, plinth: 'square', scenery: 'oldtown', time: 'winter', floors: 30, height: 71 }],
  ['eropa', 'mercusuar-utara', 'Mercusuar Tanjung Utara', 'Terinspirasi mercusuar di pesisir Eropa utara',
    'Mercusuar dicat belang merah-putih supaya mudah dikenali para pelaut pada siang hari.',
    { facade: F('stripes', { a: '#f4f1ea', b: '#c23b32' }), round: true, crown: 'lantern', crownOpts: { cap: 'red' }, plinth: 'rock', scenery: 'harbor', time: 'dusk', floors: 30, height: 60, houseRoofs: true, trees: 'pine' }],
  ['eropa', 'lonceng-brugge', 'Menara Lonceng Pasar', 'Terinspirasi menara lonceng di Brugge, Belgia',
    'Menara lonceng di Brugge, Belgia, memiliki 366 anak tangga menuju puncaknya.',
    { facade: F('gothic', { stone: '#b8a27e', cols: 2 }), crown: 'belfry', crownOpts: { trim: '#d9c9a6' }, plinth: 'square', scenery: 'oldtown', time: 'golden', floors: 32, height: 83 }],
  ['eropa', 'tv-kota', 'Menara TV Kota Tembok', 'Terinspirasi menara TV di Berlin',
    'Menara TV di Berlin tingginya 368 meter dan menjadi bangunan tertinggi di Jerman.',
    { facade: F('concrete', { color: '#cfccc6' }), round: true, crown: 'antenna', crownOpts: { pod: 'ball', podColor: 'steel', mast: 2.2, ring: true }, plinth: 'square', scenery: 'downtown', time: 'night', floors: 32, height: 368 }],
  ['eropa', 'jam-astronomi', 'Menara Jam Astronomi', 'Terinspirasi balai kota tua di Praha',
    'Jam astronomi di Praha dipasang tahun 1410 dan masih berfungsi sampai sekarang.',
    { facade: F('gothic', { stone: '#9c9182', cols: 2 }), crown: 'gothic', crownOpts: { color: 'slate', height: 1.2 }, plinth: 'square', scenery: 'oldtown', time: 'golden', floors: 32, height: 70 }],
  ['eropa', 'piramida-kaca', 'Pencakar Langit Serpih Kaca', 'Terinspirasi pencakar langit di London',
    'Pencakar langit berbentuk piramida kaca di London tingginya 310 meter dan menjadi gedung tertinggi di Inggris.',
    { facade: glass({ hue: 205, sat: 18, light: 64, fins: false }), crown: 'shard', plinth: 'podium', scenery: 'harbor', time: 'dusk', floors: 34, height: 310, houseRoofs: true }],

  // ============ Timur Tengah & Afrika ============
  ['timur', 'obelisk-firaun', 'Obelisk Firaun', 'Terinspirasi obelisk Mesir kuno',
    'Obelisk Mesir kuno dipahat dari satu bongkah batu granit utuh.',
    { facade: F('marble', { hue: 28, sat: 30, light: 66, glyphs: true }), crown: 'pyramidion', crownOpts: { color: 'gold' }, plinth: 'temple', scenery: 'desert', time: 'golden', floors: 30, height: 30 }],
  ['timur', 'menara-kutubiyya', 'Menara Masjid Merah Muda', 'Terinspirasi menara masjid di Marrakesh',
    'Menara Masjid Kutubiyya di Marrakesh dibangun pada abad ke-12 dan menjadi contoh bagi banyak menara di Afrika Utara.',
    { facade: F('brick', { color: '#c07a5a', mortar: '#d9b89c', win: 'arch', cols: 2, trim: '#e2c7a8' }), crown: 'minaret', crownOpts: { balls: true, body: 'stone' }, plinth: 'square', scenery: 'desert', time: 'day', floors: 32, height: 77 }],
  ['timur', 'spiral-samarra', 'Menara Spiral Gurun', 'Terinspirasi menara spiral di Samarra, Irak',
    'Menara Malwiya di Samarra, Irak, berbentuk spiral dengan jalan melingkar di bagian luarnya.',
    { facade: F('adobe', { color: '#c6a372' }), round: true, ledge: 'cornice', ledgeColor: '#b48e5e', crown: 'windcatcher', crownOpts: { color: '#c6a372' }, plinth: 'temple', scenery: 'desert', time: 'golden', floors: 32, height: 52 }],
  ['timur', 'jam-raksasa', 'Menara Jam Raksasa', 'Terinspirasi menara jam di Makkah',
    'Jam di sebuah menara di Makkah termasuk yang terbesar di dunia; tiap mukanya berdiameter sekitar 43 meter.',
    { facade: F('deco', { stone: '#d8cdb5', panel: '#4a4336' }), crown: 'clock', crownOpts: { roof: 'dome', roofColor: 'gold', body: 'stone', lit: true }, plinth: 'podium', scenery: 'desert', time: 'night', floors: 34, height: 601 }],
  ['timur', 'bola-teluk', 'Menara Bola Teluk', 'Terinspirasi menara bola di Kuwait',
    'Menara Kuwait punya bola-bola berhias sisik biru-hijau, dan salah satunya dipakai untuk menyimpan air.',
    { facade: F('concrete', { color: '#eeece6', vlines: false }), round: true, crown: 'antenna', crownOpts: { pod: 'ball', podColor: 'blue', mast: 1.4 }, plinth: 'square', scenery: 'harbor', time: 'day', floors: 34, height: 187, trees: 'palm' }],
  ['timur', 'kaca-gurun', 'Menara Kaca Gurun', 'Terinspirasi pencakar langit meruncing di kota gurun',
    'Pencakar langit di gurun memakai kaca berlapis yang memantulkan panas matahari, dan dibuat meruncing supaya lebih tahan angin kencang.',
    { facade: glass(), crown: 'spire', plinth: 'podium', scenery: 'desert', time: 'day', floors: 36, height: 800 }],
  ['timur', 'menara-kairo', 'Menara Teratai Sungai', 'Terinspirasi menara di Kairo',
    'Menara Kairo setinggi 187 meter bentuknya menyerupai tanaman teratai, dengan kisi-kisi beton di seluruh badannya.',
    { facade: F('lattice', { color: '#e3dccd', core: '#3a3a36', cell: 64 }), round: true, crown: 'antenna', crownOpts: { pod: 'disc', mast: 1.2 }, plinth: 'square', scenery: 'desert', time: 'dusk', floors: 36, height: 187, trees: 'palm' }],
  ['timur', 'menara-samudra', 'Menara Masjid Samudra', 'Terinspirasi menara masjid di Casablanca',
    'Menara Masjid Hassan II di Casablanca tingginya 210 meter dan pada malam hari memancarkan sinar laser ke arah Makkah.',
    { facade: F('mosaic', { wall: '#efe7da', tileA: '#2f7d6b', tileB: '#e8d9b0' }), crown: 'minaret', crownOpts: { body: 'white', cap: 'green' }, plinth: 'square', scenery: 'harbor', time: 'night', floors: 38, height: 210, trees: 'palm' }],
  ['timur', 'penangkap-angin', 'Menara Penangkap Angin', 'Terinspirasi menara angin di Yazd, Iran',
    'Bangunan di kota Yazd, Iran, memakai menara penangkap angin untuk mendinginkan ruangan tanpa listrik.',
    { facade: F('adobe', { color: '#c79f6e' }), crown: 'windcatcher', plinth: 'square', scenery: 'desert', time: 'golden', floors: 38, height: 33 }],
  ['timur', 'menara-kilometer', 'Menara Satu Kilometer', 'Terinspirasi menara yang sedang dibangun di Jeddah',
    'Sebuah menara di Jeddah, Arab Saudi, dirancang menjadi gedung pertama di dunia setinggi 1 kilometer.',
    { facade: glass({ hue: 205, sat: 12, light: 66, alu: '#dfe3e6' }), crown: 'spire', crownOpts: { tiers: [0.75, 0.55, 0.4, 0.26], needle: 2.0 }, plinth: 'podium', scenery: 'desert', time: 'dusk', floors: 40, height: 1000 }],

  // ============ Amerika ============
  ['amerika', 'tugu-batu', 'Tugu Batu Ibu Kota', 'Terinspirasi tugu batu di Washington, D.C.',
    'Tugu batu di Washington, D.C. warnanya berbeda di sepertiga bagian bawah karena pembangunannya sempat terhenti lebih dari 20 tahun.',
    { facade: F('marble', { hue: 38, sat: 10, light: 86 }), crown: 'pyramidion', crownOpts: { color: 'white' }, plinth: 'square', scenery: 'park', time: 'day', floors: 34, height: 169 }],
  ['amerika', 'mercusuar-spiral', 'Mercusuar Belang Spiral', 'Terinspirasi mercusuar di Cape Hatteras',
    'Mercusuar Cape Hatteras di Amerika Serikat pernah dipindahkan utuh sejauh sekitar 880 meter pada 1999 karena pantainya terkikis.',
    { facade: F('stripes', { a: '#f4f1ea', b: '#24272b', spiral: true }), round: true, crown: 'lantern', crownOpts: { cap: 'black' }, plinth: 'rock', scenery: 'harbor', time: 'golden', floors: 36, height: 64, trees: 'pine' }],
  ['amerika', 'deco-manhattan', 'Gedung Art Deco Manhattan', 'Terinspirasi gedung art deco di New York',
    'Pencakar langit art deco yang termasyhur di New York dibangun hanya dalam waktu sekitar 410 hari.',
    { facade: F('deco', { stone: '#d6cdbb', panel: '#5a5248' }), crown: 'deco', crownOpts: { color: 'stone', mast: 1.6 }, plinth: 'podium', scenery: 'downtown', time: 'golden', floors: 38, height: 443 }],
  ['amerika', 'mahkota-baja', 'Menara Mahkota Baja', 'Terinspirasi gedung art deco bermahkota baja di New York',
    'Puncak sebuah gedung art deco di New York dilapisi baja tahan karat dan berbentuk lengkungan bertingkat seperti sinar matahari.',
    { facade: F('deco', { stone: '#c9c6c0', panel: '#3d3f44', piers: 8 }), crown: 'deco', crownOpts: { sunburst: true }, plinth: 'podium', scenery: 'downtown', time: 'dusk', floors: 38, height: 319 }],
  ['amerika', 'menara-jarum', 'Menara Jarum Pelabuhan', 'Terinspirasi menara berbentuk jarum di Seattle',
    'Menara berbentuk jarum di Seattle dibangun untuk pameran dunia tahun 1962.',
    { facade: F('lattice', { color: '#f1efea', core: '#7b8288', cell: 96 }), round: true, crown: 'antenna', crownOpts: { pod: 'saucer', mast: 1.0 }, plinth: 'square', scenery: 'harbor', time: 'day', floors: 40, height: 184, trees: 'pine' }],
  ['amerika', 'menara-danau', 'Menara Danau Utara', 'Terinspirasi menara TV di Toronto',
    'Menara TV di Toronto tingginya 553 meter dan menjadi struktur berdiri bebas tertinggi di dunia selama lebih dari 30 tahun.',
    { facade: F('concrete', { color: '#cfcbc3' }), round: true, crown: 'antenna', crownOpts: { pod: 'disc', mast: 3.0 }, plinth: 'square', scenery: 'harbor', time: 'night', floors: 40, height: 553 }],
  ['amerika', 'menara-hitam', 'Menara Hitam Berangin', 'Terinspirasi pencakar langit hitam di Chicago',
    'Di lantai 103 sebuah pencakar langit di Chicago ada balkon kaca tempat pengunjung bisa berdiri di ketinggian 412 meter.',
    { facade: glass({ hue: 215, sat: 10, light: 26, alu: '#3a3d42', spandrel: '#1d2024' }), crown: 'twinMast', plinth: 'podium', scenery: 'harbor', time: 'day', floors: 42, height: 442 }],
  ['amerika', 'menara-gempa', 'Menara Tahan Gempa', 'Terinspirasi gedung tinggi di Kota Meksiko',
    'Sebuah gedung tinggi di Kota Meksiko bertahan dari gempa besar tahun 1957 dan 1985 berkat fondasi tiangnya yang dalam.',
    { facade: glass({ hue: 190, sat: 25, light: 46, cols: 6 }), crown: 'antenna', crownOpts: { pod: 'disc', body: 'steel', mast: 1.2 }, plinth: 'podium', scenery: 'downtown', time: 'golden', floors: 42, height: 182 }],
  ['amerika', 'menara-andes', 'Menara Kaki Andes', 'Terinspirasi gedung tertinggi di Amerika Latin',
    'Gedung tertinggi di Amerika Latin berada di Santiago, Chile, dengan tinggi sekitar 300 meter.',
    { facade: glass({ hue: 200, sat: 30, light: 58 }), crown: 'shard', plinth: 'podium', scenery: 'downtown', time: 'dusk', floors: 44, height: 300 }],
  ['amerika', 'menara-kebebasan', 'Menara Kebebasan', 'Terinspirasi pencakar langit utama di New York',
    'Pencakar langit utama di New York tingginya 1.776 kaki, mengingatkan pada tahun kemerdekaan Amerika Serikat, 1776.',
    { facade: glass({ hue: 205, sat: 20, light: 60, alu: '#d8dde1', fins: false }), crown: 'spire', crownOpts: { tiers: [0.7, 0.5], needle: 2.2 }, plinth: 'podium', scenery: 'harbor', time: 'night', floors: 46, height: 541 }],

  // ============ Puncak Dunia ============
  ['dunia', 'menara-merdeka', 'Menara Seratus Delapan Belas', 'Terinspirasi gedung tertinggi kedua di dunia, di Kuala Lumpur',
    'Gedung tertinggi kedua di dunia berada di Kuala Lumpur, dengan tinggi sekitar 679 meter.',
    { facade: glass({ hue: 205, sat: 30, light: 60 }), crown: 'spire', crownOpts: { tiers: [0.7, 0.5, 0.32], needle: 2.4 }, plinth: 'podium', scenery: 'downtown', time: 'dusk', floors: 46, height: 679 }],
  ['dunia', 'menara-langit', 'Menara Langit Musashi', 'Terinspirasi menara pemancar di Tokyo',
    'Menara pemancar di Tokyo tingginya 634 meter, angka yang bisa dibaca "Mu-sa-shi", nama lama daerah Tokyo.',
    { facade: F('lattice', { color: '#f2f3f4', core: '#5d6670', cell: 80 }), round: true, crown: 'antenna', crownOpts: { pod: 'disc', body: 'white', mast: 2.6 }, plinth: 'square', scenery: 'downtown', time: 'night', floors: 48, height: 634 }],
  ['dunia', 'kota-kilat', 'Menara Kota Kilat', 'Terinspirasi pencakar langit di Shenzhen',
    'Shenzhen tumbuh dari kota kecil menjadi kota metropolitan penuh pencakar langit hanya dalam waktu sekitar 40 tahun.',
    { facade: glass({ hue: 210, sat: 8, light: 70, alu: '#e9ecee', cols: 6 }), crown: 'spire', crownOpts: { tiers: [0.72, 0.5], needle: 1.4 }, plinth: 'podium', scenery: 'downtown', time: 'day', floors: 48, height: 599 }],
  ['dunia', 'menara-kuas', 'Menara Kuas Keramik', 'Terinspirasi pencakar langit di Seoul',
    'Pencakar langit tertinggi di Korea Selatan, di Seoul, setinggi sekitar 555 meter, bentuknya terinspirasi keramik dan kuas tradisional Korea.',
    { facade: glass({ hue: 200, sat: 12, light: 70, fins: false }), round: true, crown: 'shard', plinth: 'podium', scenery: 'park', time: 'golden', floors: 50, height: 555 }],
  ['dunia', 'hutan-vertikal', 'Menara Hutan Vertikal', 'Terinspirasi menara apartemen berkebun di Milan',
    'Sepasang menara apartemen di Milan ditanami sekitar 900 pohon di balkon-balkonnya.',
    { facade: F('green'), crown: 'treeTop', plinth: 'square', scenery: 'oldtown', time: 'morning', floors: 50, height: 111 }],
  ['dunia', 'kristal-utara', 'Menara Kristal Utara', 'Terinspirasi gedung tertinggi di Eropa, di Sankt-Peterburg',
    'Gedung tertinggi di Eropa berada di Sankt-Peterburg, Rusia, dengan tinggi 462 meter.',
    { facade: glass({ hue: 200, sat: 30, light: 62 }), round: true, crown: 'spire', crownOpts: { tiers: [0.6, 0.4], needle: 2.0 }, plinth: 'podium', scenery: 'harbor', time: 'winter', floors: 52, height: 462, trees: 'pine' }],
  ['dunia', 'gerbang-miring', 'Gerbang Miring Teluk', 'Terinspirasi gedung miring di Abu Dhabi',
    'Sebuah gedung di Abu Dhabi sengaja dibuat miring 18 derajat, jauh lebih miring daripada menara di Pisa.',
    { facade: glass({ hue: 195, sat: 35, light: 55 }), crown: 'helipad', plinth: 'podium', scenery: 'desert', time: 'golden', floors: 52, height: 160, lean: 0.12 }],
  ['dunia', 'turbin-angin', 'Menara Turbin Angin', 'Terinspirasi menara kembar berturbin di Bahrain',
    'Sepasang menara di Manama, Bahrain, punya tiga turbin angin raksasa di antara kedua gedungnya.',
    { facade: glass({ hue: 200, sat: 28, light: 60 }), crown: 'helipad', plinth: 'podium', scenery: 'harbor', time: 'day', floors: 54, height: 240, trees: 'palm' }],
  ['dunia', 'puncak-dunia', 'Menara Puncak Dunia', 'Terinspirasi gedung tertinggi di dunia, di Dubai',
    'Gedung tertinggi di dunia saat ini berada di Dubai, dengan tinggi sekitar 828 meter.',
    { facade: glass({ hue: 208, sat: 14, light: 66, alu: '#e2e6e9' }), crown: 'spire', crownOpts: { tiers: [0.72, 0.56, 0.42, 0.3, 0.2], needle: 2.6 }, plinth: 'podium', scenery: 'desert', time: 'night', floors: 58, height: 828 }],
  ['dunia', 'menara-lapis-agung', 'Menara Lapis Agung', 'Menara impian buatan Menara Lapis',
    'Semakin tinggi gedung, semakin besar pengaruh angin. Perancang pencakar langit menguji model gedungnya di terowongan angin sebelum dibangun.',
    { facade: glass({ hue: 42, sat: 45, light: 58, alu: '#e8d6a8', spandrel: '#4a3f2a' }), crown: 'spire', crownOpts: { tiers: [0.75, 0.55, 0.38, 0.24], needle: 3.0 }, plinth: 'podium', scenery: 'downtown', time: 'night', floors: 60, height: 1200 }]
];

/* ---------- Kurva kesulitan ---------- */
const DIFF = ['Mudah', 'Sedang', 'Sulit', 'Ekstrem'];
function curve(i, n) {
  const t = n > 1 ? i / (n - 1) : 0;
  const out = {
    speed: { base: +(2.5 + t * 1.1).toFixed(2), inc: +(0.07 + t * 0.09).toFixed(3), max: +(5.2 + t * 4.2).toFixed(2) },
    // pola gerak bergantian supaya tiap level terasa berbeda (tetap adil & sama untuk semua)
    motion: i >= 12 && i % 4 === 3 ? 'ease' : i >= 28 && i % 5 === 4 ? 'pulse' : 'linear',
    start: i >= 20 && i % 7 === 5 ? 2.6 : 3,
    grow: !(i >= 40 && i % 3 === 2)
  };
  // Jangan menumpuk mekanik sulit di satu level: level bandul selalu berlantai
  // normal dan boleh melebar.
  if (out.motion === 'ease') { out.start = 3; out.grow = true; }
  return out;
}
// Label mengikuti urutan level (kecepatan sudah disetel agar kesulitan naik mulus, lihat tuning.js).
const diffLabel = (i) => DIFF[i < 15 ? 0 : i < 35 ? 1 : i < 50 ? 2 : 3];

export const LEVELS = RAW.map(([region, id, name, inspiration, fact, o], index) => {
  const time = TIMES[o.time] || TIMES.day;
  const c = curve(index, RAW.length);
  const lvl = {
    index, number: index + 1, region, id, name, inspiration, fact,
    style: o.facade.style, facade: o.facade, round: !!o.round, ledge: o.ledge, ledgeColor: o.ledgeColor, roofColor: o.roofColor,
    crown: o.crown, crownOpts: o.crownOpts || {}, plinth: o.plinth, scenery: o.scenery, trees: o.trees, houseRoofs: o.houseRoofs,
    floors: o.floors, heightM: o.height, lean: o.lean || 0,
    speed: o.speed || TUNED_SPEED[id] || c.speed, rawSpeed: o.speed || c.speed, motion: o.motion || c.motion, start: o.start || c.start, grow: o.grow ?? c.grow,
    time: o.time, timeLabel: time.label,
    sky: time.sky, sun: time.sun, clouds: time.clouds, cloudColor: time.cloudColor, stars: !!time.stars, night: !!time.night,
    glow: time.glow, cityGlow: time.cityGlow, hemi: time.hemi, env: time.env, exposure: time.exposure,
    snow: !!(o.snow ?? time.snow), groundColor: GROUND[o.scenery] || '#7a7a6a'
  };
  lvl.difficulty = diffLabel(index);
  return lvl;
});

export const levelsIn = (regionId) => LEVELS.filter((l) => l.region === regionId);
