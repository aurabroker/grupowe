/**
 * /llms-full.txt – pełna treść serwisu w Markdown dla asystentów AI.
 */
import type { APIRoute } from 'astro';
import { SITE, COMPANY, SERVICES, FAQ, CASE_STUDY } from '../data/site';
import { getArticles, articleUrl, htmlToMarkdown, formatDate } from '../lib/articles';

export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const out: string[] = [];
  const p = (...l: string[]) => out.push(...l, '');

  p(`# ${SITE.name} – ${SITE.tagline}`, '', `> ${SITE.description}`);
  p('Adres: ' + SITE.url, `Telefon: ${SITE.phone}`, `E-mail: ${SITE.email}`, `Instagram: ${SITE.instagram}`);

  p('## O firmie');
  p(`grupowe.pro to marka ${COMPANY.legalName} – niezależnego, licencjonowanego brokera ubezpieczeniowego specjalizującego się w ubezpieczeniach grupowych i benefitach pracowniczych dla firm.`);
  p(
    `- Siedziba: ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}`,
    `- KRS: ${COMPANY.krs} (${COMPANY.court})`,
    `- REGON: ${COMPANY.regon}`,
    `- Kapitał zakładowy: ${COMPANY.shareCapital}`,
    `- Zezwolenie KNF: nr ${COMPANY.knfPermit}`,
    `- Rejestr brokerów ubezpieczeniowych: nr ${COMPANY.brokerRegister}`,
    `- Obszar działania: cała Polska (zdalnie i stacjonarnie)`,
    `- Minimalna wielkość firmy: 3–5 pracowników`,
    `- Koszt usługi dla firmy: 0 zł (wynagrodzenie brokera wypłaca ubezpieczyciel)`,
  );
  p('### Broker a agent');
  p('Agent ubezpieczeniowy działa w imieniu towarzystwa ubezpieczeniowego. Broker działa wyłącznie w imieniu klienta: porównuje oferty całego rynku, negocjuje warunki i ponosi odpowiedzialność za rekomendację. Działalność brokerska wymaga zezwolenia KNF, wpisu do rejestru brokerów i obowiązkowego ubezpieczenia OC.');
  p('### Jak pracujemy');
  p('1. Analiza struktury zatrudnienia i obecnych polis.', '2. Zapytanie ofertowe (slip brokerski) do wszystkich liczących się ubezpieczycieli.', '3. Porównanie ofert w jednej tabeli i rekomendacja.', '4. Negocjacje warunków w imieniu klienta.', '5. Wdrożenie: komunikacja do pracowników, deklaracje elektroniczne, start ochrony.', '6. Bieżąca obsługa, roszczenia, odnowienia.');

  p('## Usługi');
  for (const s of SERVICES) {
    p(`### ${s.name}`, '', `URL: ${SITE.url}/${s.slug}/`, '', s.lead, '', ...s.intro);
    p('**Dla kogo:**', ...s.forWhom.map((x) => `- ${x}`));
    p('**Co obejmuje:**', ...s.covers.map((c) => `- ${c.title}: ${c.text}`));
    p('**Przebieg wdrożenia:**', ...s.process.map((x, i) => `${i + 1}. ${x}`));
    p('**Pytania:**', ...s.faq.flatMap((f) => [`- ${f.q}`, `  ${f.a}`]));
  }

  p('## Case study', '', `Klient: ${CASE_STUDY.client} (${CASE_STUDY.scope})`, '', `Wyzwanie: ${CASE_STUDY.challenge}`, '', `Rozwiązanie: ${CASE_STUDY.solution}`, '', `Efekt: ${CASE_STUDY.result}`);

  p('## Najczęstsze pytania (FAQ)');
  for (const f of FAQ) p(`### ${f.q}`, '', f.a);

  p('## Aktualności', '', `Indeks: ${SITE.url}/aktualnosci/ · RSS: ${SITE.url}/aktualnosci/rss.xml`);
  for (const a of articles) {
    p(`### ${a.title}`, '', `URL: ${SITE.url}${articleUrl(a)}`, `Data publikacji: ${formatDate(a.published_at)}`, a.tags.length ? `Tagi: ${a.tags.join(', ')}` : '', a.source_url ? `Źródło: ${a.source_title ?? ''} ${a.source_url}`.trim() : '', '', a.excerpt, '', htmlToMarkdown(a.content));
  }

  p('## Dokumenty', '', `- Polityka prywatności: ${SITE.url}/polityka-prywatnosci/`, `- Nota RODO: ${SITE.url}/rodo/`, `- Regulamin: ${SITE.url}/regulamin/`);

  return new Response(out.join('\n').replace(/\n{3,}/g, '\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
