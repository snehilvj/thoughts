---
title: "UI Showcase: Every Element in Action"
description: "A comprehensive demo of all typography, code blocks, markdown features, and visual elements available on this blog."
pubDate: 2026-03-21
tags: ["tech", "meta", "webdev"]
draft: false
---

This post exists to showcase every visual element the blog supports. Think of it as a living style guide — if something looks off here, it needs fixing.

## Headings

The heading hierarchy uses Lora (serif) with decreasing sizes. Each level has distinct visual weight.

### Third-level heading

Used for subsections within a topic. Still prominent but clearly subordinate.

#### Fourth-level heading

For fine-grained organization. Rarely needed, but available.

## Text Formatting

Regular paragraph text is set in Geist Sans at 18px with generous 1.8 line-height. It should feel comfortable to read for long stretches — like a good book, not a technical manual.

Here's **bold text** for emphasis, *italic text* for tone, and ***bold italic*** when you really mean it. You can also use `inline code` for technical terms like `useState` or `docker-compose.yml`.

Sometimes you need to ~~strike through~~ a thought. And sometimes you need a [link to somewhere](https://github.com/snehilvj) to reference external content.

## Blockquotes

> The best code is no code at all. Every line of code you write is a line that needs to be maintained, debugged, and understood by the next person.

Blockquotes get a left accent border and a subtle background. They should feel like a pull-quote or a notable aside.

> **Nested emphasis works too.**
>
> Multi-paragraph blockquotes maintain their styling throughout. Use them for extended quotes, important callouts, or philosophical asides.

## Lists

### Unordered lists

- First item — the basics
- Second item with some **bold** and `code`
- Third item that's a bit longer to show how line wrapping looks when the content extends beyond a single line in the layout
- Nested items work too:
  - Sub-item one
  - Sub-item two
  - Sub-item three

### Ordered lists

1. Install dependencies
2. Configure the project
3. Write your content
4. Deploy to production
5. Never touch it again (just kidding)

### Mixed nesting

1. **Set up the project**
   - Clone the repository
   - Run `pnpm install`
   - Create your `.env` file
2. **Configure content**
   - Add posts to `src/content/blog/`
   - Update `src/config.ts` with your details
3. **Deploy**
   - Push to `main` branch
   - GitHub Actions handles the rest

## Code Blocks

### JavaScript / TypeScript

```typescript
interface BlogPost {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  draft?: boolean;
}

async function getSortedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Arrow functions with ligatures: => !== === >=
const filterByTag = (posts: BlogPost[], tag: string) =>
  posts.filter((post) => post.data.tags.includes(tag));
```

### Python

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class BlogPost:
    title: str
    description: str
    pub_date: datetime
    tags: list[str]
    draft: bool = False
    hero_image: Optional[str] = None

    @property
    def reading_time(self) -> str:
        words = len(self.content.split())
        minutes = max(1, words // 225)
        return f"{minutes} min read"

    def __repr__(self) -> str:
        return f"<Post: {self.title}>"
```

### Bash / Shell

```bash
# Deploy to production
#!/bin/bash
set -euo pipefail

echo "Building site..."
pnpm run build

echo "Deploying to GitHub Pages..."
git add dist/
git commit -m "deploy: $(date +%Y-%m-%d)"
git push origin main

echo "Done! Site is live."
```

### CSS

```css
:root {
  --color-accent: #6366f1;
  --font-heading: 'Lora', Georgia, serif;
  --transition-base: 250ms ease;
}

.post-card {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: transform var(--transition-fast);
}

.post-card:hover .post-card__title {
  color: var(--color-accent);
}
```

### JSON

```json
{
  "name": "thoughts",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

### Inline code in context

When you run `pnpm run dev`, the server starts on `http://localhost:4321`. The `astro.config.mjs` file controls the `site` URL and `base` path. Use `import.meta.env.BASE_URL` to reference it in templates.

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | Done | CSS custom properties + localStorage |
| Search | Done | Client-side JSON index, Cmd+K |
| Tags | Done | Category-colored pills |
| RSS | Done | Auto-generated at `/rss.xml` |
| SEO | Done | OG tags, JSON-LD, sitemap |
| LLM SEO | Done | `llms.txt` + `llms-full.txt` |

### Wider table

| Technology | Purpose | Bundle Size | Why Chosen |
|-----------|---------|-------------|------------|
| Astro | Static site gen | ~0KB client JS | Content-first, fast builds |
| Three.js | 3D hero | ~150KB (tree-shaken) | Industry standard, well documented |
| Shiki | Syntax highlighting | 0KB (build-time) | Built into Astro, dual-theme |
| Vanilla CSS | Styling | ~8KB | Full control, no framework overhead |

## Horizontal Rules

Content before the rule.

---

Content after the rule. Horizontal rules create visual breathing room between distinct sections.

## Images

Images get rounded corners and auto-centering. If you add a hero image to your frontmatter, it appears at the top of the post.

## Combining Elements

Here's a realistic scenario combining multiple elements — a technical explanation:

The blog's theme system works in three layers:

1. **CSS custom properties** define all colors in `:root` (dark default) and `[data-theme='light']`
2. **An inline script** in `<head>` reads `localStorage` before first paint:

```javascript
const stored = localStorage.getItem('theme');
const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light';
document.documentElement.dataset.theme = stored || preferred;
```

3. **A mutation observer** on the 3D scene watches for theme changes and updates Three.js material colors

> This three-layer approach ensures zero flash of wrong theme, smooth transitions, and consistent 3D colors — all without a framework.

The result is a seamless experience where:

- First visit respects system preference
- Manual toggle persists across sessions
- The 3D hero adapts its color palette in real-time
- Code blocks switch between `github-light` and `github-dark` themes

## Long-form Prose

This paragraph is intentionally longer to demonstrate how the blog handles extended prose. The line-height of 1.8 and max-width of 680px create a comfortable reading measure — roughly 65-75 characters per line, which research suggests is optimal for sustained reading. The serif headings (Lora) provide visual anchors as you scan, while the sans-serif body (Geist Sans) stays clean and legible. The drop cap on the first paragraph of each post adds a magazine-like touch without being kitschy.

Good typography isn't about picking fancy fonts. It's about invisible decisions — line-height, letter-spacing, font-size ratios, measure width — that make reading feel effortless. You shouldn't notice the typography. You should just notice that you've been reading for five minutes and it felt easy.

---

*That's the full showcase. If you're reading this in dark mode, try switching to light (and vice versa) to see how all elements adapt.*
