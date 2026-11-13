# Szkice artykułów (strategia treści, miesiąc 1)

Pliki w tym katalogu to źródło artykułów wpisanych do Aura CMS (tabela `aura_articles`, `status = draft`, `platforms = {Grupowe.pro}`).
Każdy plik zaczyna się komentarzem z metadanymi (`title`, `slug`, `tags`, `excerpt`); reszta to treść HTML w formacie,
który renderuje szablon `src/pages/aktualnosci/[slug].astro` (bez `<h1>`; `excerpt` jest leadem i pierwszą odpowiedzią).

| # | Slug | Klaster | Status |
|---|------|---------|--------|
| 2 | `ubezpieczenie-grupowe-od-ilu-osob` | K1 | szkic w CMS |
| 26 | `broker-ubezpieczeniowy-a-agent-dla-firmy` | K7 | szkic w CMS |
| 13 | `pakiet-medyczny-pit-zus-trzy-warianty` | K3 | szkic w CMS |
| 20 | `ile-kosztuje-l4-pracodawce-kalkulator` | K5 | szkic w CMS |
| 1 | `ubezpieczenie-grupowe-dla-pracownikow-przewodnik` | K1 (filar) | szkic w CMS |

Przed publikacją każdego tekstu: weryfikacja liczb i przepisów wg listy ze strategii (progi liczebności w OWU, kwoty składek,
§ 2 ust. 1 pkt 26, art. 16 ust. 1 pkt 59 CIT, dane ZUS 2025), redakcja, zdjęcie główne i data publikacji w CMS.
Po zmianie statusu na `published` strona przebuduje się sama (workflow `cms-refresh` lub push do `main`).
