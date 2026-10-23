import fs from 'node:fs'; import opentype from 'opentype.js';
import { facetText, hexMark, NAVY, ROSE, LIGHT } from './facet.mjs';
const OUT = '/home/user/grupowe/brand'; fs.mkdirSync(OUT + '/mockups', { recursive: true });
const font = opentype.loadSync(process.env.INTER_BLACK_TTF || (process.env.S + '/fonts/inter/extras/ttf/Inter-Black.ttf'));
const MONO = Array(6).fill('#1E294A'), WHITE = Array(6).fill('#FFFFFF');
const svg = (vb, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${body}</svg>\n`;
const write = (n, s) => { fs.writeFileSync(`${OUT}/${n}`, s); console.log('✓', n); };
const APEX = [0.44, 0.42], INNER = 0.5;

// ── sygnet ──
const mk = (o) => hexMark({ apex: APEX, inner: INNER, ...o });
const M = mk({});
const markSvg = (o) => svg(`0 0 ${M.w.toFixed(2)} ${M.h.toFixed(2)}`, mk(o).svg, 'grupowe.pro');
write('mark.svg', markSvg({}));
write('mark-on-dark.svg', markSvg({ armsRamp: LIGHT }));
// mono: płaski heksagon z cienkimi liniami faset (grawer / pieczęć)
const monoMark = (color) => { const m = mk({ armsRamp: Array(6).fill(color), arcRamp: Array(6).fill(color) }); return m.svg.replace(/stroke-width="0.3"/g, 'stroke-width="0.9"'); };
write('mark-mono.svg', svg(`0 0 ${M.w.toFixed(2)} ${M.h.toFixed(2)}`, monoMark('#1E294A'), 'grupowe.pro'));
write('mark-white.svg', svg(`0 0 ${M.w.toFixed(2)} ${M.h.toFixed(2)}`, monoMark('#FFFFFF'), 'grupowe.pro'));

// ── napis fasetowany ──
function wordmark({ size = 100, navy = NAVY, rose = ROSE, grid = 7, flat = false } = {}) {
  if (flat) {
    const a = font.getPath('grupowe', 0, 0, size, { kerning: true, letterSpacing: -0.035 });
    const adv = font.getAdvanceWidth('grupowe', size, { kerning: true, letterSpacing: -0.035 });
    const b = font.getPath('.pro', adv, 0, size, { kerning: true, letterSpacing: -0.035 });
    const bb1 = a.getBoundingBox(), bb2 = b.getBoundingBox();
    return { svg: `<path d="${a.toPathData(2)}" fill="${navy[5]}"/><path d="${b.toPathData(2)}" fill="${rose[3]}"/>`, bbox: { x1: bb1.x1, y1: Math.min(bb1.y1, bb2.y1), x2: bb2.x2, y2: Math.max(bb1.y2, bb2.y2) } };
  }
  const a = facetText(font, 'grupowe', size, 0, 0, { ramp: navy, grid, seed: 11 });
  const b = facetText(font, '.pro', size, a.advance, 0, { ramp: rose, grid, seed: 23 });
  return { svg: a.svg + b.svg, bbox: { x1: a.bbox.x1, y1: Math.min(a.bbox.y1, b.bbox.y1), x2: b.bbox.x2, y2: Math.max(a.bbox.y2, b.bbox.y2) } };
}
const W = wordmark({}); // 100px, baseline y=0
write('wordmark.svg', svg(`${(W.bbox.x1 - 4).toFixed(1)} ${(W.bbox.y1 - 4).toFixed(1)} ${(W.bbox.x2 - W.bbox.x1 + 8).toFixed(1)} ${(W.bbox.y2 - W.bbox.y1 + 8).toFixed(1)}`, W.svg, 'grupowe.pro'));
const Wd = wordmark({ navy: LIGHT });
write('wordmark-dark.svg', svg(`${(Wd.bbox.x1 - 4).toFixed(1)} ${(Wd.bbox.y1 - 4).toFixed(1)} ${(Wd.bbox.x2 - Wd.bbox.x1 + 8).toFixed(1)} ${(Wd.bbox.y2 - Wd.bbox.y1 + 8).toFixed(1)}`, Wd.svg, 'grupowe.pro'));

// ── logo poziome ──
function horizontal(name, { mark, word }) {
  const size = 72; const w = wordmark({ size, ...word });
  const mh = 78, ms = mh / M.h, mw = M.w * ms;          // znak 78 wysokości
  const gap = 18, pad = 10;
  const capTop = w.bbox.y1, base = 0;                    // y1 ujemne (nad baseline), descender poniżej 0
  // wyrównanie: środek wersalikowej części napisu ≈ środek znaku
  const textMid = (capTop + base) / 2, markMid = mh / 2;
  const ty = markMid - textMid;                          // baseline napisu
  const descend = w.bbox.y2;                             // ile wystaje pod baseline
  const H = Math.max(mh, ty + descend) + pad * 2;
  const tx = mw + gap - w.bbox.x1;
  const Wt = tx + w.bbox.x2 + pad * 2;
  const body = `<g transform="translate(${pad} ${pad})"><g transform="scale(${ms.toFixed(4)})">${mk(mark).svg}</g><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)})">${w.svg}</g></g>`;
  write(name, svg(`0 0 ${Wt.toFixed(1)} ${H.toFixed(1)}`, body, 'grupowe.pro – ubezpieczenia grupowe dla firm'));
}
horizontal('logo-horizontal.svg', { mark: {}, word: {} });
horizontal('logo-horizontal-dark.svg', { mark: { armsRamp: LIGHT }, word: { navy: LIGHT } });
horizontal('logo-horizontal-mono.svg', { mark: { armsRamp: MONO, arcRamp: MONO }, word: { flat: true, navy: MONO, rose: MONO } });
horizontal('logo-horizontal-flat.svg', { mark: {}, word: { flat: true } });   // sygnet fasetowany + napis płaski (małe rozmiary)

// ── logo pionowe ──
{
  const size = 44, w = wordmark({ size }); const tw = w.bbox.x2 - w.bbox.x1;
  const mh = 92, ms = mh / M.h, mw = M.w * ms; const pad = 12, gap = 16;
  const Wt = Math.max(tw, mw) + pad * 2; const mx = (Wt - mw) / 2, tx = (Wt - tw) / 2 - w.bbox.x1;
  const ty = pad + mh + gap - w.bbox.y1; const H = ty + w.bbox.y2 + pad;
  write('logo-stacked.svg', svg(`0 0 ${Wt.toFixed(1)} ${H.toFixed(1)}`, `<g transform="translate(${mx.toFixed(2)} ${pad}) scale(${ms.toFixed(4)})">${M.svg}</g><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)})">${w.svg}</g>`, 'grupowe.pro'));
}

// ── ikony ──
function tile(name, { bg = '#1E294A', mark = { armsRamp: LIGHT }, radius = 22, scale = 0.66 }) {
  const S = 100, s = (S * scale) / M.h, w = M.w * s, h = M.h * s;
  write(name, svg(`0 0 ${S} ${S}`, `<rect width="${S}" height="${S}" rx="${radius}" fill="${bg}"/><g transform="translate(${((S - w) / 2).toFixed(2)} ${((S - h) / 2).toFixed(2)}) scale(${s.toFixed(4)})">${mk(mark).svg}</g>`, 'grupowe.pro'));
}
tile('icon.svg', {});
tile('icon-light.svg', { bg: '#FFFFFF', mark: {} });
tile('icon-rose.svg', { bg: '#E11D48', mark: { armsRamp: WHITE, arcRamp: WHITE } });
tile('favicon.svg', { radius: 18, scale: 0.74 });

fs.copyFileSync(`${OUT}/favicon.svg`, '/home/user/grupowe/public/favicon.svg');
fs.copyFileSync(`${OUT}/logo-horizontal.svg`, '/home/user/grupowe/public/logo.svg');
fs.copyFileSync(`${OUT}/logo-horizontal-dark.svg`, '/home/user/grupowe/public/logo-dark.svg');
console.log('public/ updated');
