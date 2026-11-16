// Testy POST /api/kontakt: `npm test` (node --test, Node >= 22 uruchamia worker/index.ts bez kompilacji).
// Requesty "bota" odtwarzają nagłówki prawdziwych spamowych zgłoszeń z logów Workera (15.11.2026):
// klient HTTP/1.0 bez Origin / Sec-Fetch-*, wszystkie pola tekstowe wypełnione, honeypot pusty.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.ts';

const env = {
  RESEND_API_KEY: 'test',
  MAIL_FROM: 'test <formularz@example.com>',
  MAIL_TO: 'odbiorca@example.com',
  TURNSTILE_SECRET: 'turnstile-secret',
  SITE_URL: 'https://grupowe.pro',
  ASSETS: { fetch: async () => new Response('asset') },
};

// Atrapa sieci: siteverify przepuszcza tylko token zaczynający się od "ok-", Resend zawsze przyjmuje.
let sent = [];
let verified = [];
beforeEach(() => {
  sent = [];
  verified = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/turnstile/v0/siteverify')) {
      const token = init.body.get('response');
      verified.push({ token, secret: init.body.get('secret'), ip: init.body.get('remoteip') });
      return Response.json(token.startsWith('ok-') ? { success: true } : { success: false, 'error-codes': ['invalid-input-response'] });
    }
    sent.push({ url: String(url), body: JSON.parse(init.body) });
    return Response.json({ id: 'x' });
  };
});

const VALID_NIP = '5260250995'; // poprawna suma kontrolna
const form = (over = {}) => new URLSearchParams({
  page: '/kontakt/', ref: 'DIRECT', name: 'Jan Kowalski', company: 'Firma', email: 'jan@firma.pl',
  phone: '500 600 700', nip: '', staff: '11-50', message: 'Prosimy o wycenę.', 'cf-turnstile-response': 'ok-token', ...over,
}).toString();

// Nagłówki jak w logach Cloudflare dla zgłoszeń "Robertnub" / "RobertExemn".
const botHeaders = {
  accept: '*/*',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 CCleaner/130.0.0.0',
  referer: 'https://grupowe.pro/kontakt/',
  'content-type': 'application/x-www-form-urlencoded',
  pragma: 'no-cache',
};

// Zwykłe wysłanie formularza w przeglądarce (nawigacja POST, bez JS).
const browserHeaders = {
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'pl-PL,pl;q=0.9',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  origin: 'https://grupowe.pro',
  referer: 'https://grupowe.pro/kontakt/',
  'content-type': 'application/x-www-form-urlencoded',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-dest': 'document',
};

const post = (headers, body, url = 'https://grupowe.pro/api/kontakt') =>
  worker.fetch(new Request(url, { method: 'POST', headers, body }), env);

test('przeglądarka: zgłoszenie wysłane, przekierowanie na /dziekujemy/', async () => {
  const res = await post(browserHeaders, form({ nip: VALID_NIP }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://grupowe.pro/dziekujemy/');
  assert.equal(sent.length, 1);
});

test('przeglądarka z www.grupowe.pro: zgłoszenie wysłane', async () => {
  const res = await post({ ...browserHeaders, origin: 'https://www.grupowe.pro' }, form(), 'https://www.grupowe.pro/api/kontakt');
  assert.equal(res.headers.get('location'), 'https://grupowe.pro/dziekujemy/');
  assert.equal(sent.length, 1);
});

test('przeglądarka bez Sec-Fetch-* (starsza), ale z Origin: zgłoszenie wysłane', async () => {
  const { 'sec-fetch-site': _a, 'sec-fetch-mode': _b, 'sec-fetch-dest': _c, ...h } = browserHeaders;
  await post(h, form());
  assert.equal(sent.length, 1);
});

test('wysyłka przez fetch z JSON (accept: application/json) z tej samej strony: ok', async () => {
  const res = await post({ ...browserHeaders, accept: 'application/json', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' }, form());
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(sent.length, 1);
});

test('bot z logów (bez Origin i Sec-Fetch-*): nic nie wysłane', async () => {
  const res = await post(botHeaders, form({ name: 'Robertnub', company: 'google', nip: VALID_NIP, message: 'Dia duit, theastaigh uaim do phraghas a fháil.' }));
  assert.equal(sent.length, 0);
  assert.match(res.headers.get('location') ?? '', /\/kontakt\/\?blad=/);
});

test('POST z obcej domeny (Origin inny niż strona): nic nie wysłane', async () => {
  await post({ ...browserHeaders, origin: 'https://spam.example', 'sec-fetch-site': 'cross-site' }, form());
  assert.equal(sent.length, 0);
});

test('Sec-Fetch-Site: cross-site przy pasującym Origin: nic nie wysłane', async () => {
  await post({ ...browserHeaders, 'sec-fetch-site': 'cross-site' }, form());
  assert.equal(sent.length, 0);
});

test('NIP z błędną sumą kontrolną (jak u bota): odrzucony z komunikatem', async () => {
  const res = await post(browserHeaders, form({ nip: '4330855886' }));
  assert.equal(sent.length, 0);
  assert.match(decodeURIComponent(res.headers.get('location') ?? ''), /NIP/);
});

test('NIP ze spacjami i myślnikami, poprawny: ok', async () => {
  await post(browserHeaders, form({ nip: '526-025-09-95' }));
  assert.equal(sent.length, 1);
});

test('Turnstile: brak tokenu (bot bez JS): nic nie wysłane, siteverify nie pytane', async () => {
  const res = await post(browserHeaders, form({ 'cf-turnstile-response': '' }));
  assert.equal(sent.length, 0);
  assert.equal(verified.length, 0);
  assert.match(decodeURIComponent(res.headers.get('location') ?? ''), /Weryfikacja antyspamowa/);
});

test('Turnstile: token odrzucony przez siteverify: nic nie wysłane', async () => {
  await post(browserHeaders, form({ 'cf-turnstile-response': 'podrobiony' }));
  assert.equal(verified.length, 1);
  assert.equal(sent.length, 0);
});

test('Turnstile: do siteverify idzie secret, IP klienta i pełny token (2048 znaków, bez ucinania)', async () => {
  const long = 'ok-' + 'x'.repeat(2045);
  await post({ ...browserHeaders, 'cf-connecting-ip': '203.0.113.7' }, form({ 'cf-turnstile-response': long }));
  assert.deepEqual(verified, [{ token: long, secret: 'turnstile-secret', ip: '203.0.113.7' }]);
  assert.equal(sent.length, 1);
});

test('Turnstile: błąd walidacji nie zużywa tokenu (siteverify nie pytane)', async () => {
  await post(browserHeaders, form({ email: 'zly-adres' }));
  assert.equal(verified.length, 0);
  assert.equal(sent.length, 0);
});

test('Turnstile: brak secretu w Workerze: zgłoszenie odrzucone, nie wysłane bez weryfikacji', async () => {
  const { TURNSTILE_SECRET: _s, ...noSecret } = env;
  const res = await worker.fetch(new Request('https://grupowe.pro/api/kontakt', { method: 'POST', headers: browserHeaders, body: form() }), noSecret);
  assert.equal(sent.length, 0);
  assert.match(res.headers.get('location') ?? '', /blad=/);
});

test('honeypot zaznaczony: udany wynik dla bota, nic nie wysłane', async () => {
  const res = await post(browserHeaders, form({ botcheck: 'on' }));
  assert.equal(res.headers.get('location'), 'https://grupowe.pro/dziekujemy/');
  assert.equal(sent.length, 0);
});
