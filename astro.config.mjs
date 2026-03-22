import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://snehilvj.github.io',
  base: '/thoughts/',
  integrations: [
    mermaid({
      autoTheme: false,
      theme: 'base',
      mermaidConfig: {
        themeVariables: {
          // Match our warm amber design system (dark default)
          background: '#1e1e1e',
          primaryColor: '#3a3530',
          primaryTextColor: '#e0ddd5',
          primaryBorderColor: '#e2a052',
          secondaryColor: '#2a2520',
          secondaryTextColor: '#e0ddd5',
          secondaryBorderColor: '#9a9790',
          tertiaryColor: '#1e1e1e',
          tertiaryTextColor: '#e0ddd5',
          tertiaryBorderColor: '#5c5a56',
          lineColor: '#9a9790',
          textColor: '#e0ddd5',
          mainBkg: '#3a3530',
          nodeBorder: '#e2a052',
          clusterBkg: '#242424',
          clusterBorder: '#5c5a56',
          titleColor: '#e0ddd5',
          edgeLabelBackground: '#1e1e1e',
          nodeTextColor: '#e0ddd5',
          // Sequence diagram
          actorBkg: '#3a3530',
          actorBorder: '#e2a052',
          actorTextColor: '#e0ddd5',
          actorLineColor: '#5c5a56',
          signalColor: '#e0ddd5',
          signalTextColor: '#e0ddd5',
          labelBoxBkgColor: '#3a3530',
          labelBoxBorderColor: '#e2a052',
          labelTextColor: '#e0ddd5',
          loopTextColor: '#e0ddd5',
          noteBkgColor: '#3a2e1e',
          noteBorderColor: '#e2a052',
          noteTextColor: '#e0ddd5',
          // Fonts
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
