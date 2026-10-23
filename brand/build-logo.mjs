import opentype from 'opentype.js';
import fs from 'node:fs';

const OUT = '/home/user/grupowe/brand';
fs.mkdirSync(OUT, { recursive: true });
const font = opentype.loadSync(process.env.INTER_BLACK_TTF);

// ── Geometria „U” z utratadochodu.pl (bez zmian) + oryginalne tony błękitu ──
const FACETS = [
  ['10,8 28,8 19,26','#8FD5F3'],['10,8 19,26 10,32','#B3E3F8'],['28,8 19,26 28,32','#29ADE4'],['10,32 19,26 28,32','#5CC6EF'],
  ['10,32 28,32 19,50','#8FD5F3'],['10,32 19,50 10,56','#B3E3F8'],['28,32 19,50 28,56','#1697CE'],['10,56 19,50 28,56','#5CC6EF'],
  ['52,8 70,8 61,26','#5CC6EF'],['52,8 61,26 52,32','#8FD5F3'],['70,8 61,26 70,32','#1697CE'],['52,32 61,26 70,32','#29ADE4'],
  ['52,32 70,32 61,50','#5CC6EF'],['52,32 61,50 52,56','#8FD5F3'],['70,32 61,50 70,56','#0E86BC'],['52,56 61,50 70,56','#1697CE'],
  ['10,56 14,71 28,56','#B3E3F8'],['14,71 29.6,62 28,56','#8FD5F3'],['14,71 25,82 29.6,62','#5CC6EF'],['25,82 34,66.4 29.6,62','#8FD5F3'],
  ['25,82 40,86 34,66.4','#29ADE4'],['40,86 40,68 34,66.4','#5CC6EF'],['40,86 55,82 40,68','#1697CE'],['55,82 46,66.4 40,68','#29ADE4'],
  ['55,82 66,71 46,66.4','#0E86BC'],['66,71 50.4,62 46,66.4','#1697CE'],['66,71 70,56 50.4,62','#1697CE'],['70,56 52,56 50.4,62','#29ADE4'],
];
// Ramki znaku: x 10..70, y 8..86  (60 × 78)
const MARK = { x: 10, y: 8, w: 60, h: 78 };
const ARC_FROM = 16; // fasety 17–28 = łuk (fundament)

// Mapowanie tonów: oryginalny błękit (jasny→ciemny) -> rampa docelowa (jasny→ciemny)
const BLUE = ['#B3E3F8','#8FD5F3','#5CC6EF','#29ADE4','#1697CE','#0E86BC'];
const RAMPS = {
  navy:  ['#A9B3D6','#7F8BBB','#5A6AA2','#3E4F8A','#2A3B69','#1E294A'],
  rose:  ['#F7B3C1','#F0849B','#E9557A','#E11D48','#C3153E','#9F1239'],
  light: ['#FFFFFF','#EEF1F9','#D6DCEE','#B9C3E2','#9AA7D2','#7C8CC2'],   // na granatowym tle
  mono:  ['#1E294A','#1E294A','#1E294A','#1E294A','#1E294A','#1E294A'],
  white: ['#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF'],
};
const mapColor = (hex, ramp) => ramp[BLUE.indexOf(hex)];

/** Fasety jako <g>; arms/arc = nazwy ramp. tx/ty/s = transformacja. */
function facets({ arms = 'navy', arc = 'rose', tx = 0, ty = 0, s = 1, opacityArc = 1 } = {}) {
  const polys = FACETS.map(([pts, c], i) => {
    const ramp = RAMPS[i >= ARC_FROM ? arc : arms];
    const fill = mapColor(c, ramp);
    const flat = ramp === RAMPS.mono || ramp === RAMPS.white;
    return `<polygon points="${pts}" fill="${fill}"${flat ? ` stroke="${fill}" stroke-width="0.4" stroke-linejoin="round"` : ''}/>`;
  }).join('');
  return `<g transform="translate(${tx} ${ty}) scale(${s})">${polys}</g>`;
}

// Wordmark jako ścieżki (Inter Black). Zwraca {d, bbox} dla danego tekstu.
function word(text, size, x, y, letterSpacing) {
  const p = font.getPath(text, x, y, size, { kerning: true, letterSpacing });
  const b = p.getBoundingBox();
  return { d: p.toPathData(3), b, adv: font.getAdvanceWidth(text, size, { kerning: true, letterSpacing }) };
}

const svg = (vb, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" ${extra}>${body}</svg>\n`;
const write = (name, s) => { fs.writeFileSync(`${OUT}/${name}`, s); console.log('✓', name); };

// ── 1. Sam znak (sygnet) ──
const markBody = (opts) => facets({ ...opts, tx: -MARK.x, ty: -MARK.y });
write('mark.svg',        svg(`0 0 ${MARK.w} ${MARK.h}`, markBody({}), 'aria-label="grupowe.pro"'));
write('mark-mono.svg',   svg(`0 0 ${MARK.w} ${MARK.h}`, markBody({ arms: 'mono', arc: 'mono' }), 'aria-label="grupowe.pro"'));
write('mark-white.svg',  svg(`0 0 ${MARK.w} ${MARK.h}`, markBody({ arms: 'white', arc: 'white' }), 'aria-label="grupowe.pro"'));
write('mark-on-dark.svg',svg(`0 0 ${MARK.w} ${MARK.h}`, markBody({ arms: 'light', arc: 'rose' }), 'aria-label="grupowe.pro"'));

// ── 2. Logo poziome: znak + „grupowe.pro” ──
function horizontal({ textNavy = '#1E294A', textRose = '#E11D48', arms = 'navy', arc = 'rose', bg = null, name }) {
  const H = 78;                   // wysokość znaku w jednostkach
  const size = 64;                // rozmiar pisma
  const ls = -0.035;              // em (opentype.js) – tracking-tighter jak na stronie
  const gap = 22;
  const baseline = H - 5;         // optycznie: baseline nieco nad dolną krawędzią łuku
  const w1 = word('grupowe', size, MARK.w + gap, baseline, ls);
  const w2 = word('.pro', size, MARK.w + gap + w1.adv, baseline, ls);
  const right = Math.ceil(w2.b.x2);
  const pad = 10;
  const W = right + pad, Hh = H + pad * 2;
  const body = (bg ? `<rect width="${W}" height="${Hh}" fill="${bg}"/>` : '') +
    `<g transform="translate(${pad} ${pad})">` +
    facets({ arms, arc, tx: -MARK.x, ty: -MARK.y }) +
    `<path d="${w1.d}" fill="${textNavy}"/><path d="${w2.d}" fill="${textRose}"/></g>`;
  write(name, svg(`0 0 ${W} ${Hh}`, body, 'aria-label="grupowe.pro – ubezpieczenia grupowe dla firm"'));
  return { W, Hh };
}
horizontal({ name: 'logo-horizontal.svg' });
horizontal({ name: 'logo-horizontal-dark.svg', textNavy: '#FFFFFF', arms: 'light', arc: 'rose' });
horizontal({ name: 'logo-horizontal-mono.svg', textNavy: '#1E294A', textRose: '#1E294A', arms: 'mono', arc: 'mono' });

// ── 3. Logo pionowe (stacked) ──
{
  const size = 40, ls = -0.035;
  const w1 = word('grupowe', size, 0, 0, ls); const w2 = word('.pro', size, w1.adv, 0, ls);
  const tw = w2.b.x2 - w1.b.x1;
  const markScale = 1.0, mw = MARK.w * markScale, mh = MARK.h * markScale;
  const W = Math.max(tw, mw) + 24, pad = 12;
  const mx = (W - mw) / 2, tx = (W - tw) / 2 - w1.b.x1;
  const ty = pad + mh + 18 + size * 0.73; // baseline
  const H = ty + 8 + pad;
  const body = `<g transform="translate(${mx} ${pad})">` + facets({ tx: -MARK.x, ty: -MARK.y }) + `</g>` +
    `<g transform="translate(${tx} ${ty})"><path d="${w1.d}" fill="#1E294A"/><path d="${w2.d}" fill="#E11D48"/></g>`;
  write('logo-stacked.svg', svg(`0 0 ${W} ${H}`, body, 'aria-label="grupowe.pro"'));
}

// ── 4. Ikona-kafelek (app icon / favicon) ──
function tile({ name, bg = '#1E294A', arms = 'light', arc = 'rose', radius = 22 }) {
  const S = 100; // kafelek 100×100, znak wyśrodkowany, wysokość ~62%
  const s = 62 / MARK.h; const w = MARK.w * s, h = MARK.h * s;
  const body = `<rect width="${S}" height="${S}" rx="${radius}" fill="${bg}"/>` +
    facets({ arms, arc, tx: (S - w) / 2 - MARK.x * s, ty: (S - h) / 2 - MARK.y * s, s });
  write(name, svg(`0 0 ${S} ${S}`, body, 'aria-label="grupowe.pro"'));
}
tile({ name: 'icon.svg' });
tile({ name: 'icon-light.svg', bg: '#FFFFFF', arms: 'navy', arc: 'rose' });
tile({ name: 'icon-rose.svg', bg: '#E11D48', arms: 'white', arc: 'white' });
// favicon: kafelek bez zaokrąglenia nie jest potrzebny – przeglądarki same maskują; zostawiamy lekki radius
tile({ name: 'favicon.svg', radius: 18 });

// ── 5. Kopie do public/ (używane przez stronę) ──
fs.copyFileSync(`${OUT}/favicon.svg`, '/home/user/grupowe/public/favicon.svg');
fs.copyFileSync(`${OUT}/logo-horizontal.svg`, '/home/user/grupowe/public/logo.svg');
console.log('public/ updated');
