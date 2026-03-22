---
title: "How I Built This Blog"
description: "A technical walkthrough of building a terminal-inspired personal blog with Astro and vanilla CSS  - no frameworks, no fuss."
pubDate: 2026-03-22
tags: ["tech", "webdev", "astro"]
---

I spent way too long thinking about how to build this blog. The irony of engineers over-engineering their personal websites is well documented, and I fell right into the trap. But I'm happy with where I landed.

## The stack

- **Astro** for static site generation
- **JetBrains Mono**  - monospace everything
- **Vanilla CSS** with custom properties for theming
- **Zero frontend frameworks**  - no React, no Vue, no Svelte

The whole thing ships almost zero JavaScript to the browser. Just a theme toggle. The terminal-inspired aesthetic means no fancy graphics, no animations  - just text on a dark background, the way a blog should be.

## Why Astro?

Astro's content collections are perfect for a blog. You write markdown, define a schema, and get type-safe data throughout your templates:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

The built-in Shiki integration means code blocks look good without any extra dependencies. And the dual-theme support means code highlighting respects dark/light mode automatically.

## The terminal aesthetic

Most blogs look the same  - serif headings, sans-serif body, card layouts, hero images. I wanted something different. The entire site is set in JetBrains Mono. Every element earns its place  - no decoration for decoration's sake. The warm amber accent and subtle dot grid background give it a contemplative feel, like graph paper for thinking.

It's not for everyone, but it's *mine*. And it loads fast.

## Dark mode done right

The theme system uses CSS custom properties with a `data-theme` attribute on `<html>`. A tiny inline script in the `<head>` prevents the flash of wrong theme:

```html
<script is:inline>
  const stored = localStorage.getItem('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)')
    .matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = stored || preferred;
</script>
```

The `is:inline` directive is crucial  - it prevents Astro from bundling the script, so it runs synchronously before the first paint.

## What I'd do differently

Honestly? I'd spend less time on the design and more time writing. The blog is a vehicle for content, not the other way around. But the engineer in me couldn't help it.

Now that it's built, no more excuses. Time to write.
