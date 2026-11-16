/**
 * Worker grupowe.pro – serwuje statyczny build Astro (assets) i obsługuje POST /api/kontakt:
 * waliduje formularz, odrzuca boty (Origin/Sec-Fetch-Site, honeypot, suma kontrolna NIP, Cloudflare Turnstile)
 * i wysyła zgłoszenie przez Resend. Zwykły POST -> 303 na /dziekujemy/ (albo /kontakt/?blad=...).
 * Turnstile wymaga JS w przeglądarce – bez niego zgłoszenie jest odrzucane z prośbą o telefon.
 */
interface Env {
  RESEND_API_KEY: string;   // secret Workera
  MAIL_FROM: string;        // np. "grupowe.pro <formularz@auraconsulting.pl>"
  MAIL_TO: string;          // secret: adres odbiorcy zgłoszeń
  TURNSTILE_SECRET: string; // secret: klucz tajny widżetu Turnstile "grupowe.pro formularz kontaktowy"
  SITE_URL: string;         // np. "https://grupowe.pro"
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const FIELDS = ['name', 'company', 'email', 'phone', 'nip', 'staff', 'message', 'ref', 'page'] as const;
type Field = (typeof FIELDS)[number];
type Data = Record<Field, string>;

const TOKEN = 'cf-turnstile-response'; // pole, które widżet Turnstile dokłada do formularza (token do 2048 znaków)
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const clean = (v: unknown, max = 2000) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

async function readForm(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, clean(v, k === TOKEN ? 4096 : 2000)]));
  }
  const fd = await request.formData();
  const out: Record<string, string> = {};
  fd.forEach((v, k) => { out[k] = clean(v, k === TOKEN ? 4096 : 2000); });
  return out;
}

/** Weryfikacja tokenu Turnstile po stronie serwera (token jednorazowy, ważny 5 min). */
async function verifyTurnstile(token: string, ip: string | null, secret: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  if (out.success !== true) console.warn('kontakt: odrzucony (turnstile)', out['error-codes']);
  return out.success === true;
}

/**
 * Czy POST wyszedł z przeglądarki na tej stronie? Przeglądarki wysyłają przy POST formularza
 * Origin (Referrer-Policy strony to strict-origin-when-cross-origin) oraz Sec-Fetch-Site.
 * Spamboty (skrypty HTTP podszywające się pod Chrome) nie wysyłają żadnego z nich – tak przeszły
 * zgłoszenia "Robertnub"/"RobertExemn" z 15.11.2026 mimo honeypota. Zwraca powód odrzucenia albo null.
 */
function rejectNonBrowser(request: Request, site: string): string | null {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return `sec-fetch-site=${fetchSite}`;
  const origin = request.headers.get('origin');
  if (!origin) return fetchSite ? null : 'brak Origin i Sec-Fetch-Site';
  const allowed = [new URL(site).origin, new URL(request.url).origin];
  return allowed.includes(origin) ? null : `origin=${origin}`;
}

/** Suma kontrolna NIP (wagi 6,5,7,2,3,4,5,6,7; mod 11 = ostatnia cyfra). */
function nipValid(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((s, x, i) => s + x * Number(nip[i]), 0) % 11;
  return sum !== 10 && sum === Number(nip[9]);
}

function validate(d: Data): string | null {
  if (!d.name || d.name.length < 2) return 'Podaj imię i nazwisko.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return 'Podaj poprawny adres e-mail.';
  if (d.phone.replace(/\D/g, '').length < 7) return 'Podaj numer telefonu.';
  if (d.nip && !/^\d{10}$/.test(d.nip.replace(/[\s-]/g, ''))) return 'NIP to 10 cyfr.';
  if (d.nip && !nipValid(d.nip.replace(/[\s-]/g, ''))) return 'Sprawdź NIP – ten numer jest niepoprawny.';
  if ((d.message.match(/https?:\/\//g) ?? []).length > 3) return 'Wiadomość wygląda na spam.';
  return null;
}

function buildEmail(d: Data) {
  const rows: [string, string][] = [
    ['Imię i nazwisko', d.name], ['Firma', d.company], ['E-mail', d.email], ['Telefon', d.phone],
    ['NIP', d.nip], ['Liczba pracowników', d.staff], ['Wiadomość', d.message],
    ['Źródło (ref)', d.ref || 'DIRECT'], ['Strona', d.page],
  ];
  const filled = rows.filter(([, v]) => v);
  const text = filled.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1e294a">
<h2 style="margin:0 0 16px">Nowe zapytanie z grupowe.pro</h2>
<table cellpadding="6" style="border-collapse:collapse">${filled.map(([k, v]) => `<tr><td style="color:#64748b;vertical-align:top"><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>
<p style="color:#94a3b8;font-size:12px;margin-top:24px">Odpowiedz na tę wiadomość, aby napisać bezpośrednio do nadawcy.</p></div>`;
  const subject = `Nowe zapytanie – grupowe.pro: ${d.name}${d.company ? ` (${d.company})` : ''}`;
  return { subject, text, html };
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const site = env.SITE_URL.replace(/\/$/, '');
  const fail = (msg: string, status = 400) =>
    wantsJson ? Response.json({ ok: false, error: msg }, { status }) : Response.redirect(`${site}/kontakt/?blad=${encodeURIComponent(msg)}`, 303);
  const ok = () => (wantsJson ? Response.json({ ok: true }) : Response.redirect(`${site}/dziekujemy/`, 303));

  // Widoczny błąd z numerem telefonu zamiast udawanego sukcesu: gdyby trafił się człowiek, nie gubimy leada.
  const blocked = rejectNonBrowser(request, site);
  if (blocked) {
    console.warn('kontakt: odrzucony (nie przeglądarka)', blocked);
    return fail('Nie udało się wysłać zgłoszenia. Zadzwoń: 500 502 702.', 403);
  }

  let raw: Record<string, string>;
  try { raw = await readForm(request); } catch { return fail('Nieprawidłowe dane formularza.'); }
  if (raw.botcheck) { // honeypot: udajemy sukces, nic nie wysyłamy
    console.warn('kontakt: odrzucony (honeypot)');
    return ok();
  }
  const d = Object.fromEntries(FIELDS.map((f) => [f, raw[f] ?? ''])) as Data;
  const err = validate(d);
  if (err) return fail(err); // walidacja przed Turnstile: token jest jednorazowy, nie zużywamy go na literówkę

  // Turnstile wymaga JS w przeglądarce; bez tokenu zgłoszenie nie przejdzie (spamboty nie wykonują wyzwania).
  if (!env.TURNSTILE_SECRET) {
    console.error('kontakt: brak secretu TURNSTILE_SECRET');
    return fail('Nie udało się wysłać zgłoszenia. Zadzwoń: 500 502 702.', 500);
  }
  const token = raw[TOKEN] ?? '';
  let human = false;
  if (token) {
    try { human = await verifyTurnstile(token, request.headers.get('cf-connecting-ip'), env.TURNSTILE_SECRET); }
    catch (e) { console.error('kontakt: siteverify niedostępne', e instanceof Error ? e.message : e); }
  } else {
    console.warn('kontakt: odrzucony (brak tokenu turnstile)');
  }
  if (!human) return fail('Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie albo zadzwoń: 500 502 702.', 403);

  const mail = buildEmail(d);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: `${d.name} <${d.email}>`, ...mail, tags: [{ name: 'source', value: 'grupowe-pro-form' }] }),
    });
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text());
      return fail('Nie udało się wysłać zgłoszenia. Zadzwoń: 500 502 702.', 502);
    }
  } catch (e) {
    console.error('Resend fetch failed', e instanceof Error ? e.message : e);
    return fail('Nie udało się wysłać zgłoszenia. Zadzwoń: 500 502 702.', 502);
  }
  return ok();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/kontakt') return handleContact(request, env);
    if (pathname.startsWith('/api/')) return new Response('Not Found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
