---
title: "How I Built This Blog"
description: "A technical walkthrough of building a personal blog with Astro, Three.js, and zero frameworks — including the interactive 3D hero."
pubDate: 2026-03-22
tags: ["tech", "webdev", "astro"]
---

I spent way too long thinking about how to build this blog. The irony of engineers over-engineering their personal websites is well documented, and I fell right into the trap. But I'm happy with where I landed.

## The stack

- **Astro** for static site generation
- **Three.js** for the interactive 3D hero
- **Vanilla CSS** with custom properties for theming
- **Zero frontend frameworks** — no React, no Vue, no Svelte

The whole thing ships almost zero JavaScript to the browser, except for the Three.js scene on the homepage and a few small interactive bits (theme toggle, search).

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

## The 3D hero

The homepage features a morphing icosahedron built with Three.js. It's a wireframe geometry that subtly distorts using a noise function and responds to mouse movement.

The key was making it *feel* organic without being distracting:

```javascript
const displacement = noise3D(
  ox + time * 0.3,
  oy + time * 0.2,
  oz + time * 0.4
) * 0.15;
```

Small displacement values, slow time multipliers. The effect is meditative rather than chaotic.

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

The `is:inline` directive is crucial — it prevents Astro from bundling the script, so it runs synchronously before the first paint.

## What I'd do differently

Honestly? I'd spend less time on the design and more time writing. The blog is a vehicle for content, not the other way around. But the engineer in me couldn't help it.

Now that it's built, no more excuses. Time to write.
