// @ts-check
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://grupowe.pro',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  integrations: [
    sitemap({
      // Strona podziękowania i techniczne pliki nie trafiają do mapy strony.
      filter: (page) => !page.includes('/dziekujemy/') && !page.includes('/404'),
      changefreq: ChangeFreqEnum.WEEKLY,
      priority: 0.7,
      serialize(item) {
        if (item.url === 'https://grupowe.pro/') item.priority = 1.0;
        if (item.url.includes('/aktualnosci/')) item.changefreq = ChangeFreqEnum.DAILY;
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
