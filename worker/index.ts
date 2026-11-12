/**
 * Worker grupowe.pro – serwuje statyczny build Astro (assets) i obsługuje POST /api/kontakt:
 * waliduje formularz, odrzuca boty (honeypot) i wysyła zgłoszenie przez Resend.
 * Działa bez JavaScriptu po stronie klienta: zwykły POST -> 303 na /dziekujemy/.
 */
interface Env {
  RESEND_API_KEY: string;   // secret Workera
  MAIL_FROM: string;        // np. "grupowe.pro <formularz@auraconsulting.pl>"
  MAIL_TO: string;          // np. "biuro@grupowe.pro"
  SITE_URL: string;         // np. "https://grupowe.pro"
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const FIELDS = ['name', 'company', 'email', 'phone', 'nip', 'staff', 'message', 'ref', 'page'] as const;
type Field = (typeof FIELDS)[number];
type Data = Record<Field, string>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const clean = (v: unknown, max = 2000) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

async function readForm(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, clean(v)]));
  }
  const fd = await request.formData();
  const out: Record<string, string> = {};
  fd.forEach((v, k) => { out[k] = clean(v); });
  return out;
}

function validate(d: Data): string | null {
  if (!d.name || d.name.length < 2) return 'Podaj imię i nazwisko.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return 'Podaj poprawny adres e-mail.';
  if (d.phone.replace(/\D/g, '').length < 7) return 'Podaj numer telefonu.';
  if (d.nip && !/^\d{10}$/.test(d.nip.replace(/[\s-]/g, ''))) return 'NIP to 10 cyfr.';
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

  let raw: Record<string, string>;
  try { raw = await readForm(request); } catch { return fail('Nieprawidłowe dane formularza.'); }
  if (raw.botcheck) return ok(); // honeypot: udajemy sukces, nic nie wysyłamy
  const d = Object.fromEntries(FIELDS.map((f) => [f, raw[f] ?? ''])) as Data;
  const err = validate(d);
  if (err) return fail(err);

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
