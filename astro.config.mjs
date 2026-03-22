import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://snehilvj.github.io',
  base: '/thoughts/',
  integrations: [
    mermaid({
      autoTheme: true,
      mermaidConfig: {
        themeVariables: {
          fontFamily: "-apple-system, 'SF Pro Display', system-ui, 'Inter', sans-serif",
          fontSize: '14px',
        },
      },
    }),
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math', 'mermaid'],
    },
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'vitesse-dark',
      },
    },
  },
});
