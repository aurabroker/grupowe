/**
 * Artykuły z Aura CMS (Supabase). Pobierane RAZ w czasie builda –
 * każdy artykuł staje się statyczną stroną HTML pod /aktualnosci/<slug>/.
 */

const SUPABASE_URL = import.meta.env.SUPABASE_URL ?? 'https://kukvgsjrmrqtzhkszzum.supabase.co';
// Klucz anon jest z założenia publiczny (RLS po stronie Supabase) – ten sam był wcześniej w index.html.
const SUPABASE_ANON_KEY =
  import.meta.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML z CMS
  tags: string[];
  published_at: string;
  created_at: string;
  ai_generated: boolean;
  source_url: string | null;
  source_title: string | null;
  preview_image_800: string | null;
  preview_image_1600: string | null;
  preview_image_url: string | null;
  thumbnail_url: string | null;
}

const FIELDS = [
  'id', 'slug', 'title', 'excerpt', 'content', 'tags', 'published_at', 'created_at',
  'ai_generated', 'source_url', 'source_title',
  'preview_image_800', 'preview_image_1600', 'preview_image_url', 'thumbnail_url',
].join(',');

let cache: Article[] | null = null;

export async function getArticles(): Promise<Article[]> {
  if (cache) return cache;

  const url =
    `${SUPABASE_URL}/rest/v1/aura_articles?select=${FIELDS}` +
    `&status=eq.published&platforms=cs.{"Grupowe.pro"}&order=published_at.desc`;

  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) {
    // Celowo przerywamy build – lepiej zostawić poprzednią wersję strony niż opublikować pusty blog.
    throw new Error(`Supabase: ${res.status} ${res.statusText} – ${await res.text()}`);
  }
  const rows = (await res.json()) as Article[];

  cache = rows
    .filter((a) => a.slug && a.title && a.content)
    .map((a) => ({
      ...a,
      tags: a.tags ?? [],
      excerpt: (a.excerpt ?? stripHtml(a.content).slice(0, 200)).replace(/\s+/g, ' ').trim(),
    }));
  return cache;
}

export function articleUrl(a: Pick<Article, 'slug'>) {
  return `/aktualnosci/${a.slug}/`;
}

export function articleImage(a: Article, size: 800 | 1600 = 1600) {
  return (size === 800 ? a.preview_image_800 : a.preview_image_1600) ?? a.preview_image_url ?? a.thumbnail_url ?? null;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Zamiana HTML artykułu na prosty Markdown do llms-full.txt. */
export function htmlToMarkdown(html: string) {
  return html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gis, '\n\n#### $1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<\/(p|ul|ol|div|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)')
    .replace(/<(strong|b)>(.*?)<\/\1>/gis, '**$2**')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Szacowany czas czytania (ok. 200 słów/min). */
export function readingTime(html: string) {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
