# grupowe.pro

Strona brokera ubezpieczeniowego Aura Consulting – ubezpieczenia grupowe dla firm.
Zbudowana w **Astro** z jedną zasadą nadrzędną: **maksymalna widoczność w wyszukiwarkach i u agentów AI**.

## Dlaczego tak

| Decyzja | Powód |
|---|---|
| Astro, output statyczny | Każda strona to gotowy HTML. Crawlery (Googlebot, GPTBot, ClaudeBot, PerplexityBot) dostają pełną treść bez wykonywania JS. |
| Artykuły pobierane **w czasie builda** z Supabase | Poprzednia wersja ładowała blog w przeglądarce – dla botów AI sekcja była pusta. Teraz każdy artykuł to osobna strona `/aktualnosci/<slug>/`. |
| Każda usługa to osobna strona (nie modal) | Osobny `<title>`, opis, canonical, JSON-LD `Service` + `FAQPage`. Cztery indeksowalne strony zamiast jednej. |
| JSON-LD na każdej stronie | `InsuranceAgency`, `WebSite`, `Service`, `FAQPage`, `BlogPosting`, `BreadcrumbList`, `AboutPage`, `ContactPage`. |
| `/llms.txt` i `/llms-full.txt` | Standard llmstxt.org – indeks i pełna treść serwisu w Markdown dla asystentów AI. Generowane z tych samych danych co HTML. |
| `sitemap-index.xml`, RSS, OG/Twitter, `robots.txt` z jawnym Allow dla botów AI | Komplet sygnałów dla wyszukiwarek i agentów. |
| Hosting: Cloudflare Workers (statyczne assety) | Edge w Polsce, `_headers` z cache i nagłówkami bezpieczeństwa, `_redirects` bez meta-refresh. |
| Formularz działa bez JS (POST → Web3Forms → `/dziekujemy/`) | Progresywne ulepszanie; JS tylko dla menu mobilnego i parametru `?ref=`. |
| FAQ na `<details>` | Treść odpowiedzi jest w DOM, bez JS. |

## Struktura

```
src/
  data/site.ts        ← JEDNO źródło prawdy: firma, usługi, FAQ, projekty (zmieniaj tu)
  lib/articles.ts     ← pobieranie artykułów z Supabase (build-time)
  lib/schema.ts       ← generatory JSON-LD
  layouts/Base.astro  ← <head>: SEO, OG, JSON-LD, GA
  layouts/Legal.astro ← szablon stron prawnych
  components/         ← Nav, Footer, ContactForm, Faq, ArticleCard, Section, Breadcrumbs
  pages/
    index.astro                 /
    [service].astro             /<slug-uslugi>/  (4 strony z data/site.ts)
    o-nas.astro                 /o-nas/
    kontakt.astro               /kontakt/
    aktualnosci/index.astro     /aktualnosci/
    aktualnosci/[slug].astro    /aktualnosci/<slug>/
    aktualnosci/rss.xml.ts      /aktualnosci/rss.xml
    llms.txt.ts                 /llms.txt
    llms-full.txt.ts            /llms-full.txt
    polityka-prywatnosci / rodo / regulamin / dziekujemy / 404
public/               ← robots.txt, _redirects, _headers, favicon, og-default.png, manifest
wrangler.jsonc        ← konfiguracja Cloudflare Workers (assets-only)
legacy/               ← poprzednia wersja strony (statyczny HTML), do usunięcia po wdrożeniu
```

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
```

Artykuły pobierane są z Supabase kluczem **anon** (publiczny; ten sam był wcześniej w `index.html`).
Opcjonalnie nadpisz przez `.env` (zob. `.env.example`). Jeśli Supabase nie odpowie, build **celowo** się nie uda – lepiej zostawić poprzednią wersję niż opublikować pusty blog.

## Deploy (Cloudflare Workers – statyczne assety)

Strona działa jako Worker bez własnego kodu, serwujący `dist/` (konfiguracja: `wrangler.jsonc`).
Domena `grupowe.pro` i `www` są zdefiniowane jako `routes` z `custom_domain: true` – przy pierwszym deployu wrangler
sam tworzy rekordy DNS w strefie (strefa `grupowe.pro` musi być na Cloudflare). Przekierowania i nagłówki: `public/_redirects`, `public/_headers`.

Workflow `.github/workflows/deploy.yml`:
- `pull_request` – build + `wrangler deploy --dry-run` (bez publikacji),
- push na `main`, codziennie 04:17 UTC (nowe artykuły z CMS), ręcznie (Actions → Run workflow), `repository_dispatch` typu `cms-update` – build + deploy.

**Wymagane jednorazowo** w repo → Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN` – token z szablonu „Edit Cloudflare Workers” (dash.cloudflare.com → Account API tokens → Create Token), zakres: konto Aura + strefa grupowe.pro,
- `CLOUDFLARE_ACCOUNT_ID` – z prawej kolumny strony Overview strefy w dashboardzie.

Lokalnie: `npx wrangler login`, potem `npm run deploy`.

## Stare adresy

`/polityka-prywatnosci.html`, `/rodo.html`, `/regulamin.html`, `/sitemap.xml` → 301 do nowych adresów (`public/_redirects`).
Linki `/#article-<uuid>` z poprzedniej wersji są przekierowywane na `/aktualnosci/<slug>/` małym skryptem na stronie głównej.

## Jak dodać treść

- **Usługa / FAQ / dane firmy** – edytuj `src/data/site.ts`. Strona, JSON-LD, `llms.txt` i stopka aktualizują się same.
- **Artykuł** – publikuj w Aura CMS z platformą `Grupowe.pro`; pojawi się po najbliższym buildzie.
