// Bungkus hasil `vite build` menjadi satu file HTML mandiri (JS, CSS, dan font
// di-inline) supaya bisa dibuka sebagai Artifact di aplikasi Claude.
// Pakai: npm run build && npm run artifact  → dist-artifact/menara-lapis.html
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const outDir = new URL('../dist-artifact/', import.meta.url).pathname;
const assets = join(dist, 'assets');
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const find = (re) => { const m = html.match(re); if (!m) throw new Error('Tidak ditemukan: ' + re); return m[1]; };
const jsFile = find(/<script type="module"[^>]*src="\.\/assets\/([^"]+)"/);
const cssFile = find(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+)"/);

let css = readFileSync(join(assets, cssFile), 'utf8');
// Pakai woff2 saja, di-inline sebagai data URI.
css = css.replace(/,\s*url\(\.\/[^)]+\.woff\)\s*format\("woff"\)/g, '');
css = css.replace(/url\(\.\/([^)]+\.woff2)\)/g, (_, f) =>
  `url(data:font/woff2;base64,${readFileSync(join(assets, f)).toString('base64')})`);
// Artifact sudah memberi padding safe-area di :root; jangan digandakan.
css += '\n#app{height:100%}:root{--safe-t:0px;--safe-b:0px}\n';

const js = readFileSync(join(assets, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
const appBody = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

const out = `<title>Menara Lapis</title>
<meta name="theme-color" content="#141a24">
<style>
${css}
</style>
${appBody.trim()}
<script type="module">
${js}
</script>
`;
mkdirSync(outDir, { recursive: true });
const target = join(outDir, 'menara-lapis.html');
writeFileSync(target, out);
console.log('Ditulis', target, (out.length / 1024).toFixed(0) + ' KB', readdirSync(outDir).length, 'file');
