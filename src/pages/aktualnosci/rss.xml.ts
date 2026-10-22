import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { getArticles, articleUrl, articleImage } from '../../lib/articles';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const items = articles.map((a) => {
    const link = `${SITE.url}${articleUrl(a)}`;
    const img = articleImage(a, 1600);
    return `    <item>
      <title>${esc(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <description>${esc(a.excerpt)}</description>
      ${a.tags.map((t) => `<category>${esc(t)}</category>`).join('')}
      ${img ? `<enclosure url="${esc(img)}" type="image/webp" length="0" />` : ''}
      <content:encoded><![CDATA[${a.content.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Aktualności i trendy HR – grupowe.pro</title>
    <link>${SITE.url}/aktualnosci/</link>
    <atom:link href="${SITE.url}/aktualnosci/rss.xml" rel="self" type="application/rss+xml" />
    <description>Artykuły ekspertów Aura Consulting o ubezpieczeniach grupowych, L4, ZUS i benefitach pracowniczych.</description>
    <language>pl</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
