// ── Wspólna biblioteka fasetowania ──
import opentype from 'opentype.js';
import poly2tri from 'poly2tri';

export const NAVY = ['#A9B3D6','#7F8BBB','#5A6AA2','#3E4F8A','#2A3B69','#1E294A'];
export const ROSE = ['#F7B3C1','#F0849B','#E9557A','#E11D48','#C3153E','#9F1239'];
export const LIGHT = ['#FFFFFF','#EEF1F9','#D6DCEE','#B9C3E2','#9AA7D2','#7C8CC2'];

// deterministyczny szum
export function hash(x, y, seed = 1) { let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return h - Math.floor(h); }

/** Ton fasety: światło z góry-lewej + szum, z rampy 6 tonów. */
export function tone(cx, cy, box, ramp, seed = 1, contrast = 1) {
  const nx = (cx - box.x) / box.w, ny = (cy - box.y) / box.h;            // 0..1
  let v = 0.30 + 0.50 * ny + 0.15 * nx;                                   // dół i prawa ciemniejsze
  v += (hash(cx, cy, seed) - 0.5) * 0.55 * contrast;                      // szum faset
  const i = Math.max(0, Math.min(ramp.length - 1, Math.round(v * (ramp.length - 1))));
  return ramp[i];
}

/** Konwersja ścieżki opentype na kontury (polilinie) z małą liczbą punktów na krzywej. */
export function contours(path, steps = 3) {
  const cs = []; let cur = null, last = null;
  const push = (p) => { if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.05) { cur.push(p); last = p; } };
  for (const c of path.commands) {
    if (c.type === 'M') { cur = []; cs.push(cur); last = null; push({ x: c.x, y: c.y }); }
    else if (c.type === 'L') push({ x: c.x, y: c.y });
    else if (c.type === 'Q') { for (let i = 1; i <= steps; i++) { const t = i / steps, u = 1 - t; push({ x: u*u*last.x + 2*u*t*c.x1 + t*t*c.x, y: u*u*last.y + 2*u*t*c.y1 + t*t*c.y }); } }
    else if (c.type === 'C') { for (let i = 1; i <= steps; i++) { const t = i / steps, u = 1 - t; push({ x: u*u*u*last.x + 3*u*u*t*c.x1 + 3*u*t*t*c.x2 + t*t*t*c.x, y: u*u*u*last.y + 3*u*u*t*c.y1 + 3*u*t*t*c.y2 + t*t*t*c.y }); } }
    else if (c.type === 'Z') { if (cur && cur.length && Math.hypot(cur[0].x - last.x, cur[0].y - last.y) < 0.05) cur.pop(); }
  }
  return cs.filter(c => c.length >= 3);
}
const area = (c) => c.reduce((a, p, i) => { const q = c[(i + 1) % c.length]; return a + (p.x * q.y - q.x * p.y); }, 0) / 2;
const inside = (pt, c) => { let w = false; for (let i = 0, j = c.length - 1; i < c.length; j = i++) { const a = c[i], b = c[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) w = !w; } return w; };
const distToEdges = (pt, c) => { let d = Infinity; for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; const l2 = (b.x-a.x)**2 + (b.y-a.y)**2; let t = l2 ? ((pt.x-a.x)*(b.x-a.x) + (pt.y-a.y)*(b.y-a.y)) / l2 : 0; t = Math.max(0, Math.min(1, t)); d = Math.min(d, Math.hypot(pt.x - (a.x + t*(b.x-a.x)), pt.y - (a.y + t*(b.y-a.y)))); } return d; };

/** Triangulacja glifu: kontury zewnętrzne + dziury + punkty Steinera (siatka z jitterem). */
export function facetGlyph(path, { steps = 3, grid = 9, jitter = 0.35, margin = 0.1, seed = 1 } = {}) {
  const cs = contours(path, steps);
  const outers = cs.filter(c => area(c) > 0), holes = cs.filter(c => area(c) < 0); // opentype (y w dół): zewn. dodatnie, dziury ujemne
  const tris = [];
  for (const o of outers) {
    const myHoles = holes.filter(h => inside(h[0], o));
    const bx = Math.min(...o.map(p => p.x)), by = Math.min(...o.map(p => p.y)), bX = Math.max(...o.map(p => p.x)), bY = Math.max(...o.map(p => p.y));
    const cell = Math.max(bX - bx, bY - by) / grid;
    const pts = [];
    for (let x = bx + cell / 2; x < bX; x += cell) for (let y = by + cell / 2; y < bY; y += cell) {
      const p = { x: x + (hash(x, y, seed) - 0.5) * cell * jitter * 2, y: y + (hash(y, x, seed + 3) - 0.5) * cell * jitter * 2 };
      if (!inside(p, o) || myHoles.some(h => inside(p, h))) continue;
      if (distToEdges(p, o) < cell * margin || myHoles.some(h => distToEdges(p, h) < cell * margin)) continue;
      pts.push(p);
    }
    try {
      const swc = new poly2tri.SweepContext(o.map(p => new poly2tri.Point(p.x, p.y)));
      for (const h of myHoles) swc.addHole(h.map(p => new poly2tri.Point(p.x, p.y)));
      for (const p of pts) swc.addPoint(new poly2tri.Point(p.x, p.y));
      swc.triangulate();
      for (const t of swc.getTriangles()) tris.push(t.getPoints().map(p => ({ x: p.x, y: p.y })));
    } catch (e) { console.error('triangulation failed', e.message); }
  }
  return tris;
}

/** Fasetowany napis → SVG <g>. Zwraca {svg, bbox}. */
export function facetText(font, text, size, x, y, { ramp = NAVY, letterSpacing = -0.035, seed = 1, grid = 9, contrast = 1, strokeFix = true } = {}) {
  const glyphs = font.stringToGlyphs(text);
  let cx = x, out = [], minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const scale = size / font.unitsPerEm;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const path = g.getPath(cx, y, size);
    const b = path.getBoundingBox();
    if (isFinite(b.x1)) {
      const box = { x: b.x1, y: b.y1, w: b.x2 - b.x1 || 1, h: b.y2 - b.y1 || 1 };
      const tris = facetGlyph(path, { grid, seed: seed + i });
      for (const t of tris) {
        const mx = (t[0].x + t[1].x + t[2].x) / 3, my = (t[0].y + t[1].y + t[2].y) / 3;
        const c = tone(mx, my, box, ramp, seed + i, contrast);
        out.push(`<polygon points="${t.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="${c}"${strokeFix ? ` stroke="${c}" stroke-width="${(size * 0.004).toFixed(2)}"` : ''}/>`);
      }
      minx = Math.min(minx, b.x1); miny = Math.min(miny, b.y1); maxx = Math.max(maxx, b.x2); maxy = Math.max(maxy, b.y2);
    }
    let adv = g.advanceWidth * scale;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale + letterSpacing * size;
    cx += adv;
  }
  return { svg: out.join(''), bbox: { x1: minx, y1: miny, x2: maxx, y2: maxy }, advance: cx - x };
}

/** Abstrakcyjny znak: fasetowany heksagon (pointy-top) – kamień/komórka. Dwa pierścienie, 30 faset. Róż = dolne „V”. */
export function hexMark({ w = 80, armsRamp = NAVY, arcRamp = ROSE, apex = [0.44, 0.42], inner = 0.5, roseEdges = [2, 3], seed = 7 } = {}) {
  const h = w * 2 / Math.sqrt(3);
  const V = [[w/2, 0], [w, h/4], [w, 3*h/4], [w/2, h], [0, 3*h/4], [0, h/4]];
  const A = [w * apex[0], h * apex[1]];
  const I = V.map(v => [A[0] + (v[0] - A[0]) * inner, A[1] + (v[1] - A[1]) * inner]); // wewn. heksagon wokół wierzchołka
  const tris = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const a = V[i], b = V[j], ia = I[i], ib = I[j];
    const m = [(a[0]+b[0])/2, (a[1]+b[1])/2], im = [(ia[0]+ib[0])/2, (ia[1]+ib[1])/2];
    tris.push({ t: [A, ia, im], e: i }, { t: [A, im, ib], e: i });            // rdzeń
    tris.push({ t: [ia, a, m], e: i }, { t: [ia, m, im], e: i }, { t: [im, m, b], e: i }, { t: [im, b, ib], e: i }); // pierścień
  }
  const polys = tris.map(({ t, e }, k) => {
    const ramp = roseEdges.includes(e) ? arcRamp : armsRamp;
    const cx = (t[0][0]+t[1][0]+t[2][0])/3, cy = (t[0][1]+t[1][1]+t[2][1])/3;
    const dx = cx - A[0], dy = cy - A[1]; const len = Math.hypot(dx, dy) || 1;
    const light = (-dx / len) * 0.4 + (-dy / len) * 0.8;
    const ring = k % 6 < 2 ? -0.12 : 0.06;                                   // rdzeń jaśniejszy
    let v = 0.5 - light * 0.36 + ring + (hash(cx, cy, seed) - 0.5) * 0.22;
    const idx = Math.max(0, Math.min(5, Math.round(v * 5)));
    return `<polygon points="${t.map(p => p.map(n => n.toFixed(2)).join(',')).join(' ')}" fill="${ramp[idx]}" stroke="${ramp[idx]}" stroke-width="0.3" stroke-linejoin="round"/>`;
  });
  return { svg: polys.join(''), w, h };
}
