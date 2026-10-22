/**
 * /llms.txt – zwięzły indeks strony dla asystentów AI (standard llmstxt.org).
 * Generowany z tych samych danych, co strony HTML i JSON-LD.
 */
import type { APIRoute } from 'astro';
import { SITE, COMPANY, SERVICES, FAQ } from '../data/site';
import { getArticles, articleUrl } from '../lib/articles';

export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const lines: string[] = [
    `# ${SITE.name} – ${SITE.tagline}`,
    '',
    `> ${SITE.description}`,
    '',
    `grupowe.pro to marka ${COMPANY.legalName} – licencjonowanego brokera ubezpieczeniowego (zezwolenie KNF nr ${COMPANY.knfPermit}, rejestr brokerów nr ${COMPANY.brokerRegister}) z siedzibą w Warszawie (${COMPANY.street}). Obsługujemy firmy z całej Polski, od ${'3'} pracowników. Usługa brokera jest dla firmy bezpłatna – wynagrodzenie wypłaca ubezpieczyciel.`,
    '',
    `Kontakt: tel. ${SITE.phone}, e-mail ${SITE.email}. Formularz wyceny: ${SITE.url}/kontakt/`,
    '',
    '## Usługi (ubezpieczenia grupowe dla firm)',
    '',
    ...SERVICES.map((s) => `- [${s.name}](${SITE.url}/${s.slug}/): ${s.summary}`),
    '',
    '## O firmie',
    '',
    `- [O nas – broker a agent, jak pracujemy](${SITE.url}/o-nas/)`,
    `- [Kontakt i bezpłatna wycena](${SITE.url}/kontakt/)`,
    `- [Najczęstsze pytania (FAQ)](${SITE.url}/#faq)`,
    '',
    '## Aktualności',
    '',
    `- [Wszystkie artykuły](${SITE.url}/aktualnosci/)`,
    `- [RSS](${SITE.url}/aktualnosci/rss.xml)`,
    ...articles.map((a) => `- [${a.title}](${SITE.url}${articleUrl(a)}): ${a.excerpt}`),
    '',
    '## Najczęstsze pytania',
    '',
    ...FAQ.flatMap((f) => [`**${f.q}**`, f.a, '']),
    '## Pełna treść',
    '',
    `- [llms-full.txt](${SITE.url}/llms-full.txt): cała treść serwisu w jednym pliku Markdown`,
    `- [Mapa strony](${SITE.url}/sitemap-index.xml)`,
    '',
    '## Dokumenty',
    '',
    `- [Polityka prywatności](${SITE.url}/polityka-prywatnosci/)`,
    `- [Nota RODO](${SITE.url}/rodo/)`,
    `- [Regulamin](${SITE.url}/regulamin/)`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
