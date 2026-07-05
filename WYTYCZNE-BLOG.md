# Blog „Aktualności i Trendy HR” — pełne wytyczne do odtworzenia w innym serwisie

Dokument opisuje, jak działa moduł bloga na `grupowe.pro` i jak zbudować identyczny
(albo własny, niezależny) blog na dowolnym innym serwisie. Zawiera pełny schemat bazy,
polityki bezpieczeństwa, zapytania oraz gotowy kod front-endu do skopiowania.

> **TL;DR** — Blog to **statyczny front-end** (czysty HTML + JavaScript, bez back-endu
> własnego), który w przeglądarce pobiera artykuły bezpośrednio z **Supabase** (baza
> PostgreSQL + REST API) i renderuje je jako kafelki. Kliknięcie kafelka otwiera
> pełnoekranowy „czytnik” artykułu. Treść jest **współdzielona** między wieloma serwisami
> (jeden CMS = jedna tabela), a przynależność artykułu do serwisu określa tablica
> `platforms`.

---

## 1. Architektura w skrócie

```
                       ┌─────────────────────────────────────────┐
                       │            SUPABASE (chmura)            │
                       │  Projekt: aurabroker                    │
                       │  Tabela:  public.aura_articles          │
                       │  Ochrona: Row Level Security (RLS)      │
                       │  API:     PostgREST + klucz anon        │
                       └──────────────────┬──────────────────────┘
                                          │  HTTPS (SELECT, tylko odczyt)
                                          │  filtr: status='published'
                                          │         + 'TwojSerwis' ∈ platforms
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │  STATYCZNA STRONA (GitHub Pages / dowolny hosting plików)             │
   │                                                                      │
   │  index.html                                                          │
   │   ├── <head>: ładuje supabase-js + Tailwind z CDN                    │
   │   ├── <section id="aktualnosci">  →  <div id="blogGrid">  (kafelki)  │
   │   ├── <div id="fullArticleModal"> →  czytnik pełnoekranowy           │
   │   └── <script>: klient Supabase + logika renderowania + routing hash │
   └──────────────────────────────────────────────────────────────────────┘
```

**Kluczowe cechy:**

| Cecha | Wartość |
|---|---|
| Typ front-endu | Statyczny (HTML/JS w przeglądarce), brak SSR, brak build-stepu |
| Źródło danych | Supabase (PostgreSQL) przez bibliotekę `@supabase/supabase-js@2` |
| Uwierzytelnianie zapytań | Klucz publiczny **anon** (bezpieczny do umieszczenia w kodzie, chroni go RLS) |
| Model treści | Jeden wspólny CMS dla wielu marek; rozdział po tablicy `platforms` |
| Format treści artykułu | HTML w kolumnie `content` (`<p>`, `<h3>`, `<h4>`, `<ul><li>`) |
| Nawigacja do artykułu | Deep-linking przez hash w URL: `#article-<uuid>` |
| Zależności CDN | `cdn.tailwindcss.com`, `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` |

---

## 2. Back-end: Supabase

### 2.1. Dane projektu (obecne, produkcyjne)

```
Nazwa projektu : aurabroker
Project ref    : kukvgsjrmrqtzhkszzum
Region         : eu-west-1
URL API        : https://kukvgsjrmrqtzhkszzum.supabase.co
Klucz anon     : (publiczny — patrz sekcja 4.2; chroniony przez RLS)
```

> Klucz **anon** jest zaprojektowany tak, by mógł być jawny w kliencie przeglądarki.
> Dostęp do danych ogranicza Row Level Security (RLS), nie tajność klucza. **Nigdy** nie
> umieszczaj w kliencie klucza `service_role` — ten omija RLS.

### 2.2. Tabela `public.aura_articles` — pełny schemat

To jest jedyna tabela potrzebna do działania bloga. Poniżej rzeczywisty, aktualny schemat:

| Kolumna | Typ | Null? | Domyślnie | Opis |
|---|---|---|---|---|
| `id` | `uuid` | NIE | `gen_random_uuid()` | Klucz główny; używany w deep-linkach `#article-<id>` |
| `title` | `text` | NIE | — | Tytuł artykułu (nagłówek kafelka i czytnika) |
| `excerpt` | `text` | TAK | — | Zajawka widoczna na kafelku |
| `content` | `text` | NIE | — | **Treść w HTML** (`<p>`, `<h3>`, `<h4>`, `<ul><li>`) |
| `status` | `text` | TAK | `'draft'` | `'draft'` lub `'published'`; publiczny odczyt tylko `published` |
| `tags` | `text[]` | TAK | — | Tablica tagów (na kafelku pokazywane są 2 pierwsze) |
| `ai_generated` | `boolean` | TAK | `true` | Czy generowany przez AI; steruje blokiem „źródła” w czytniku |
| `created_at` | `timestamptz` | TAK | `now()` | Data utworzenia |
| `published_at` | `timestamptz` | TAK | — | Data publikacji; wg niej sortujemy malejąco |
| `source_title` | `text` | TAK | — | Nazwa źródła/raportu (rekomendowane do bloku „źródła”) |
| `source_url` | `text` | TAK | — | Link do źródła/raportu |
| `platforms` | `text[]` | TAK | `'{AuraBenefits}'` | **Lista serwisów**, na których artykuł ma się pokazać |
| `thumbnail_url` | `text` | TAK | — | Miniatura (opcjonalnie, do rozbudowy) |
| `preview_image_url` | `text` | TAK | — | Obraz podglądu / OG (opcjonalnie) |
| `views` | `integer` | NIE | `0` | Licznik wyświetleń (opcjonalnie) |
| `slug` | `text` | TAK | — | Przyjazny adres; **obecnie nieużywany** przez front `grupowe.pro` (deep-link po `id`) |

### 2.3. DDL — utworzenie tabeli od zera (dla własnej, niezależnej instancji)

Jeśli budujesz **osobny** blog na **nowym** projekcie Supabase, wykonaj poniższy SQL
w Supabase → SQL Editor:

```sql
create table if not exists public.aura_articles (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  excerpt           text,
  content           text not null,          -- HTML
  status            text default 'draft',   -- 'draft' | 'published'
  tags              text[],
  ai_generated      boolean default true,
  created_at        timestamptz default now(),
  published_at      timestamptz,
  source_title      text,
  source_url        text,
  platforms         text[] default '{AuraBenefits}',
  thumbnail_url     text,
  preview_image_url text,
  views             integer not null default 0,
  slug              text
);

-- Indeks przyspieszający listowanie opublikowanych wpisów
create index if not exists idx_aura_articles_pub
  on public.aura_articles (status, published_at desc);
```

### 2.4. Row Level Security (RLS) — bezpieczeństwo

RLS jest **włączone**. Front-endowi (rola `anon`) wolno **tylko czytać opublikowane**
artykuły; zapis/edycja/usuwanie są zarezerwowane dla administratora. Aktualnie istnieją
m.in. polityki:

- **`Publiczny odczyt opublikowanych`** / `public_read_published` — `SELECT` gdy
  `status = 'published'` (obejmuje publiczny odczyt dla wszystkich, także `anon`).
- **`anon_read_gwarancje_articles`** — węższa polityka przykładowa dla roli `anon`:
  `status = 'published' AND 'Gwarancje.pro' = ANY(platforms)`.
- **`Admin widzi wszystko` / `admin_read_all` / `admin_insert` / `admin_update` /
  `admin_delete`** — pełny dostęp dla użytkownika, którego wpis w tabeli `profiles`
  ma `rola = 'admin'`.

> **Ważny wniosek dla nowego serwisu:** dzięki polityce `public_read_published` rola
> `anon` może odczytać **każdy** opublikowany artykuł niezależnie od platformy. Dlatego
> nowy serwis działa „od ręki” — wystarczy, że w kliencie **filtruje po swojej nazwie
> platformy**. Nie trzeba dodawać nowej polityki RLS na start.

Minimalny zestaw polityk dla **własnej** instancji:

```sql
alter table public.aura_articles enable row level security;

-- Publiczny odczyt tylko opublikowanych
create policy "public_read_published"
  on public.aura_articles
  for select
  using (status = 'published');

-- Zapis/edycja/usuwanie: tylko zalogowany administrator
-- (wymaga tabeli profiles(id uuid references auth.users, rola text))
create policy "admin_all"
  on public.aura_articles
  for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.rola = 'admin'))
  with check (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.rola = 'admin'));
```

### 2.5. Model wieloserwisowy — kolumna `platforms`

Jedna tabela obsługuje wiele marek. Artykuł pojawia się na danym serwisie, jeśli nazwa
tego serwisu znajduje się w jego tablicy `platforms`. Aktualnie w bazie występują m.in.:

```
AuraBenefits (12), UtrataDochodu.pl (8), AuraConsulting.pl (7),
Grupowe.pro (6), Gwarancje.pro (2), Idzik.org.pl (1),
RozwodBemowo.pl, RozwodLomianki.pl, RozwodMokotow.pl, RozwodTarchomin.pl (po 1)
```

Jeden artykuł może należeć do wielu serwisów naraz, np.:
`["AuraBenefits", "AuraConsulting.pl", "Grupowe.pro", "UtrataDochodu.pl"]`.

**Aby dodać nowy serwis (np. `NowaMarka.pl`) do współdzielonego CMS:**

```sql
-- Dopisz nową platformę do wybranych, już opublikowanych artykułów
update public.aura_articles
set platforms = array_append(platforms, 'NowaMarka.pl')
where status = 'published'
  and not ('NowaMarka.pl' = any(platforms))
  and 'Grupowe.pro' = any(platforms);   -- np. skopiuj zestaw z grupowe.pro
```

Następnie w kliencie nowego serwisu filtruj po `['NowaMarka.pl']` (patrz sekcja 4.3).

---

## 3. Przepływ działania (data flow) krok po kroku

1. **Ładowanie strony** → `window.onload` wywołuje `loadPublishedArticles()`.
2. **Pobranie listy** → klient Supabase wykonuje `SELECT * FROM aura_articles`
   z filtrami `status='published'` i `platforms zawiera 'TwojSerwis'`, sortowanie po
   `published_at DESC`.
3. **Render kafelków** → dla każdego wiersza budowany jest kafelek (tagi, tytuł, zajawka,
   data, „Czytaj całość →”). Kliknięcie kafelka → `openArticle(id)`.
4. **Otwarcie artykułu** → `openArticle(id)` pobiera pojedynczy wiersz po `id`, wstrzykuje
   klasy CSS do surowego HTML z `content`, wypełnia czytnik i pokazuje modal.
5. **Deep-linking** → przy otwarciu ustawiany jest hash `#article-<id>`; wejście na taki
   URL (lub odświeżenie) automatycznie otwiera właściwy artykuł (`handleHashRoute`).
6. **Zamknięcie** → przywraca hash `#aktualnosci` i przewija do sekcji z kafelkami.

---

## 4. Front-end — integracja i gotowy kod

### 4.1. Zależności (CDN, w `<head>`)

```html
<!-- Tailwind CSS (utility-first, bez build-stepu) -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Klient Supabase v2 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

> Tailwind z CDN jest wygodny do prototypów/statycznych stron. Na produkcji o dużym ruchu
> rozważ Tailwind budowany lokalnie (mniejszy CSS, brak zależności od CDN). Blog działa
> też z dowolnym innym CSS — klasy Tailwind można zamienić na własne.

### 4.2. Inicjalizacja klienta Supabase

```js
// ── Klucze API (publiczne — anon; dostęp ogranicza RLS) ──
const SB_URL = 'https://kukvgsjrmrqtzhkszzum.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24i' +
  'LCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY';

const SB_CLIENT = supabase.createClient(SB_URL, SB_KEY);
```

> To jest klucz **anon** obecnego projektu. Jeśli budujesz **własną** instancję Supabase,
> podmień `SB_URL` i `SB_KEY` na wartości ze swojego projektu:
> Supabase → **Project Settings → API** (`Project URL` oraz `anon public` key).

### 4.3. Pobranie i render listy kafelków

Jedyna rzecz, którą zmieniasz per serwis, to **nazwa platformy** w `.contains(...)`:

```js
const PLATFORM = 'Grupowe.pro'; // ← zmień na nazwę swojego serwisu

async function loadPublishedArticles() {
  const grid = document.getElementById('blogGrid');

  const { data, error } = await SB_CLIENT.from('aura_articles')
    .select('*')
    .eq('status', 'published')
    .contains('platforms', [PLATFORM])          // filtr po serwisie
    .order('published_at', { ascending: false });

  if (error || !data) {
    grid.innerHTML = '<div class="col-span-full text-center text-[#e11d48] font-bold">Błąd połączenia z bazą wiedzy.</div>';
    return;
  }
  if (data.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Brak opublikowanych artykułów.</div>';
    return;
  }

  grid.innerHTML = data.map(art => `
    <div class="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border border-slate-200 flex flex-col h-full group"
         onclick="openArticle('${art.id}')">
      <div class="flex gap-2 mb-5 flex-wrap">
        ${(art.tags || []).slice(0, 2).map(t =>
          `<span class="bg-rose-50 text-[#e11d48] text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider">${t}</span>`
        ).join('')}
      </div>
      <h3 class="text-xl md:text-2xl font-black text-[#1e294a] mb-4 line-clamp-3 leading-snug group-hover:text-[#e11d48] transition-colors">${art.title}</h3>
      <p class="text-slate-500 text-sm mb-8 flex-grow line-clamp-4">${art.excerpt || ''}</p>
      <div class="border-t border-slate-100 pt-5 flex justify-between items-center text-xs font-bold text-slate-400">
        <span>${art.published_at ? new Date(art.published_at).toLocaleDateString('pl-PL') : ''}</span>
        <span class="text-[#e11d48] group-hover:translate-x-1 transition-transform">Czytaj całość →</span>
      </div>
    </div>
  `).join('');
}
```

Odpowiadający kontener HTML w sekcji strony:

```html
<section class="py-20 bg-white" id="aktualnosci">
  <div class="container mx-auto px-5 max-w-6xl">
    <div class="text-center mb-12">
      <span class="text-[#e11d48] font-extrabold tracking-widest text-xs uppercase mb-3 block">Wiedza Ekspercka</span>
      <h2 class="text-3xl md:text-4xl font-extrabold text-[#1e294a]">Aktualności i Trendy HR</h2>
    </div>
    <div id="blogGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="col-span-full py-16 text-center text-slate-400 text-sm animate-pulse">
        Trwa pobieranie artykułów…
      </div>
    </div>
  </div>
</section>
```

### 4.4. Czytnik artykułu (modal pełnoekranowy)

`content` jest przechowywany jako **surowy HTML**. Przed wyświetleniem front wstrzykuje
klasy Tailwind do tagów `<h3> <h4> <p> <ul>` (żeby ostylować treść z bazy):

```js
async function openArticle(id, skipHashChange = false) {
  const { data } = await SB_CLIENT.from('aura_articles')
    .select('*').eq('id', id).single();
  if (!data) { closeArticleReader(); return; }

  document.getElementById('readerTitle').textContent = data.title;
  document.getElementById('readerDate').textContent =
    'Opublikowano: ' + new Date(data.published_at || data.created_at).toLocaleString('pl-PL');

  // Wstrzyknięcie klas CSS do surowego HTML z kolumny content
  const contentHtml = data.content
    .replace(/<h3>/g, '<h3 class="text-2xl md:text-3xl font-black text-[#1e294a] mt-12 mb-5 border-b border-slate-100 pb-3">')
    .replace(/<h4>/g, '<h4 class="text-xl font-bold text-[#1e294a] mt-8 mb-3">')
    .replace(/<p>/g,  '<p class="mb-5 text-justify">')
    .replace(/<ul>/g, '<ul class="list-disc list-outside pl-6 mb-8 space-y-3 marker:text-[#e11d48] font-medium">');

  document.getElementById('readerContent').innerHTML = contentHtml;
  document.getElementById('readerTags').innerHTML = (data.tags || []).map(t =>
    `<span class="bg-rose-50 border border-rose-100 text-[#e11d48] text-xs px-3 py-1 rounded-lg font-black uppercase tracking-wider">${t}</span>`
  ).join('');

  // Blok „źródła” (dla treści oznaczonych jako AI). REKOMENDACJA: używaj kolumn
  // source_title / source_url z bazy zamiast dopasowań po tytule.
  const sourceBlock = document.getElementById('readerSourceBlock');
  if (data.ai_generated && data.source_title) {
    document.getElementById('readerSourceText').textContent = data.source_title;
    document.getElementById('readerSourceLink').href = data.source_url || '#';
    sourceBlock.classList.remove('hidden');
  } else {
    sourceBlock.classList.add('hidden');
  }

  const modal = document.getElementById('fullArticleModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  modal.scrollTo(0, 0);

  if (!skipHashChange) history.pushState(null, null, '#article-' + id);
}

function closeArticleReader(skipHashChange = false) {
  const modal = document.getElementById('fullArticleModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
  if (!skipHashChange) {
    history.pushState(null, null, '#aktualnosci');
    document.getElementById('aktualnosci')?.scrollIntoView();
  }
}
```

> **Uwaga o bloku „źródła”:** oryginalny `grupowe.pro` dobiera nazwę i link źródła
> **heurystycznie** — sprawdzając, czy tytuł zawiera „2026”, „SHRM” itd. To rozwiązanie
> kruche. Skoro w bazie są już kolumny `source_title` i `source_url`, w nowym serwisie
> **czytaj je wprost z rekordu** (jak w kodzie wyżej) — jest to prostsze i odporne na zmiany.

HTML czytnika (minimalny szkielet):

```html
<div id="fullArticleModal" class="fixed inset-0 bg-white z-[100] hidden flex-col overflow-y-auto">
  <div class="max-w-4xl mx-auto w-full flex-grow flex flex-col">
    <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
      <button onclick="closeArticleReader()" class="text-sm font-bold text-[#1e294a] hover:text-[#e11d48]">← Wróć</button>
      <button onclick="copyArticleLink()" class="text-xs bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold">Skopiuj link</button>
    </div>
    <div class="p-6 md:p-12 lg:p-16 flex-grow">
      <div id="readerTags" class="mb-6 flex flex-wrap gap-2"></div>
      <h1 id="readerTitle" class="text-3xl md:text-5xl font-black text-[#1e294a] mb-6 leading-tight"></h1>
      <div id="readerDate" class="text-sm text-slate-400 font-bold mb-10 uppercase tracking-widest border-b border-slate-100 pb-6"></div>
      <div id="readerContent" class="text-slate-700 leading-relaxed space-y-6 text-[16px] md:text-lg"></div>
      <div id="readerSourceBlock" class="hidden mt-16 p-8 bg-slate-50 border-l-4 border-[#e11d48] rounded-r-xl">
        <p class="text-xs uppercase tracking-widest font-black mb-2">🤖 Opracowano na podstawie źródeł:</p>
        <p id="readerSourceText" class="text-base font-semibold text-slate-800"></p>
        <a id="readerSourceLink" href="#" target="_blank" class="text-sm text-[#e11d48] font-bold hover:underline mt-3 inline-block">Zobacz oryginalne źródło →</a>
      </div>
    </div>
  </div>
</div>
```

### 4.5. Routing po hashu (deep-linking) + kopiowanie linku

```js
function handleHashRoute() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('article-')) {
    openArticle(hash.replace('article-', ''), true);
  } else {
    closeArticleReader(true);
  }
}
window.addEventListener('hashchange', handleHashRoute);

function copyArticleLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert('Link skopiowany do schowka!'))
    .catch(() => alert('Skopiuj ręcznie:\n' + window.location.href));
}

// Inicjalizacja
window.onload = () => {
  loadPublishedArticles();
  handleHashRoute();   // otwórz artykuł, jeśli wejście z linkiem #article-<id>
};
```

---

## 5. Jak zbudować blog na NOWYM serwisie — dwie ścieżki

### Ścieżka A — podłączenie do istniejącego, współdzielonego CMS (najszybsza)

Używasz tej samej bazy `aurabroker`. Nowy serwis pokazuje wybrane artykuły.

1. **Skopiuj front** (sekcja 4) do `index.html` nowego serwisu.
2. Zostaw `SB_URL` / `SB_KEY` z sekcji 4.2 (to publiczny anon obecnego projektu).
3. Ustaw `const PLATFORM = 'NazwaTwojegoSerwisu';`.
4. Oznacz artykuły dla nowego serwisu — dopisz jego nazwę do `platforms`
   (SQL z sekcji 2.5) **albo** filtruj po już istniejącej platformie (np. `AuraBenefits`).
5. Gotowe — artykuły ze `status='published'` i pasującą platformą pojawią się od razu.

> Zaleta: jeden panel/CMS, treść współdzielona między markami. Wada: zależność od jednego
> wspólnego projektu Supabase.

### Ścieżka B — własna, niezależna instancja

Pełna separacja: własny projekt Supabase, własne treści.

1. Załóż nowy projekt na [supabase.com](https://supabase.com) → zapisz `Project URL`
   i `anon public` key (**Project Settings → API**).
2. Utwórz tabelę: SQL z sekcji **2.3** (DDL).
3. Włącz RLS i dodaj polityki: SQL z sekcji **2.4**.
   (Dla panelu admina potrzebna też tabela `profiles(id uuid, rola text)` powiązana
   z `auth.users` — lub uprość model uprawnień pod własne potrzeby.)
4. Wklej front (sekcja 4), podmień `SB_URL` / `SB_KEY` na swoje, ustaw `PLATFORM`.
5. Dodaj treści — patrz sekcja 6.

---

## 6. Dodawanie i publikowanie artykułów

### 6.1. Format treści (`content`)

Treść to **HTML** złożony z: `<p>…</p>`, `<h3>…</h3>`, `<h4>…</h4>`,
`<ul><li>…</li></ul>`. Front sam dokłada style — w bazie trzymasz czysty HTML
semantyczny, np.:

```html
<p>Wprowadzenie do tematu…</p>
<h3>Najważniejszy nagłówek sekcji</h3>
<p>Rozwinięcie…</p>
<h4>Podsekcja</h4>
<ul>
  <li>Punkt pierwszy</li>
  <li>Punkt drugi</li>
</ul>
```

### 6.2. Wstawienie artykułu (SQL)

```sql
insert into public.aura_articles
  (title, excerpt, content, status, tags, ai_generated,
   published_at, source_title, source_url, platforms, slug)
values (
  'Tytuł artykułu',
  'Krótka zajawka na kafelek.',
  '<p>Treść w HTML…</p><h3>Sekcja</h3><p>…</p>',
  'published',
  array['Tag1','Tag2'],
  false,
  now(),
  'Nazwa źródła / raportu',           -- lub NULL
  'https://link-do-zrodla',           -- lub NULL
  array['Grupowe.pro','AuraBenefits'],-- serwisy, na których ma się pokazać
  'tytul-artykulu'                    -- opcjonalny slug
);
```

### 6.3. Panele do edycji (opcje)

- **Supabase Studio** → Table Editor (najprościej, bez kodu).
- **SQL Editor** (jak wyżej).
- Własny panel admina (logowanie przez Supabase Auth + polityki `admin_*`).

---

## 7. SEO i ograniczenia (ważne przy przenoszeniu)

Ten blog jest w pełni **renderowany po stronie klienta (CSR)**. Konsekwencje:

- **Brak osobnych adresów URL dla artykułów.** Każdy artykuł żyje pod
  `…/#article-<uuid>` (hash), a nie pod własnym `…/artykul/tytul`. Roboty i social
  scrapery zwykle **nie** widzą treści spod hasza. Meta/OG są takie same dla całej strony.
- **Treść ładuje się dynamicznie** — bez pełnego renderu po stronie serwera część botów
  jej nie zaindeksuje.
- **Uzależnienie od CDN** (Tailwind, supabase-js) i od dostępności Supabase.

Jeśli SEO bloga jest istotne, rozważ w nowym serwisie:

1. **Realne ścieżki + prerender/SSR** — np. Next.js / Astro / SvelteKit pobierające
   `aura_articles` w czasie builda lub na serwerze i generujące osobne strony
   `/blog/<slug>` (kolumna `slug` już istnieje!) z własnymi `<title>`, `<meta>`, OG.
2. **`sitemap.xml`** generowany z listy opublikowanych `slug`.
3. **Dane strukturalne** `Article` (JSON-LD) na każdej stronie artykułu.
4. **`preview_image_url`** jako `og:image` dla ładnych podglądów w social media.

> Kolumny `slug`, `preview_image_url`, `source_title`, `source_url`, `views`, `thumbnail_url`
> już są w schemacie — to gotowe „haki” pod wersję SEO-friendly, choć obecny front na
> `grupowe.pro` z nich (poza podstawami) nie korzysta.

---

## 8. Bezpieczeństwo — lista kontrolna

- ✅ W kliencie **tylko** klucz `anon` (nigdy `service_role`).
- ✅ RLS **włączone**; publiczny dostęp ograniczony do `status='published'` (odczyt).
- ✅ Zapis/edycja/usuwanie **wyłącznie** dla roli admin (polityki `admin_*`).
- ⚠️ `content` to HTML wstrzykiwany przez `innerHTML` — **ufaj tylko treści od zaufanych
  autorów**. Jeśli treść mogliby dodawać użytkownicy zewnętrzni, sanetyzuj HTML
  (np. DOMPurify) przed renderem, by uniknąć XSS.
- ⚠️ Klucz anon jest jawny z założenia — to **nie** jest sekret. Ochronę zapewnia RLS,
  nie ukrywanie klucza.

---

## 9. Ściąga — minimalny checklist wdrożenia na nowym serwisie

```
[ ] 1. Hosting plików statycznych (GitHub Pages / Netlify / Vercel / dowolny)
[ ] 2. index.html z <head> ładującym Tailwind + supabase-js (sekcja 4.1)
[ ] 3. Kontener <div id="blogGrid"> + modal #fullArticleModal (sekcja 4.3–4.4)
[ ] 4. Skrypt: createClient + loadPublishedArticles + openArticle + routing (sekcja 4)
[ ] 5. Ustaw SB_URL / SB_KEY (własne LUB współdzielone) i const PLATFORM
[ ] 6. Baza: tabela aura_articles + RLS (ścieżka B) LUB dopisz platformę (ścieżka A)
[ ] 7. Dodaj artykuły (status='published', platforms zawiera Twój serwis)
[ ] 8. (Opcjonalnie) wersja SEO: slug → osobne URL + SSR/prerender + sitemap
```

---

### Mapa plików źródłowych w tym repozytorium

| Element | Lokalizacja w `index.html` |
|---|---|
| Ładowanie Tailwind + supabase-js | linie ~27–29 |
| Sekcja bloga `#aktualnosci` + `#blogGrid` | linie ~205–220 |
| Modal czytnika `#fullArticleModal` | linie ~504–546 |
| Klucze i klient Supabase | linie ~551–556 |
| `loadPublishedArticles()` | linie ~558–584 |
| `openArticle()` / `closeArticleReader()` | linie ~586–649 |
| `copyArticleLink()` / routing hash | linie ~651–671 |
| Inicjalizacja `window.onload` | linie ~811–816 |
