# Tech Stack

## Core

| Technology | Version | Purpose |
|---|---|---|
| [Astro](https://astro.build/) | 5.x | Static site framework, routing, build |
| [Preact](https://preactjs.com/) | 10.x | Interactive UI components (~3KB) |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety, developer experience |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first CSS framework |

## Client-Side Libraries

| Library | Purpose |
|---|---|
| [pdf-lib](https://pdf-lib.js.org/) | PDF manipulation (merge, split, compress, rotate) |
| [js-yaml](https://github.com/nodeca/js-yaml) | YAML parsing and serialization |
| [Lucide](https://lucide.dev/) | Icon set (tree-shakable) |

## Dev Tools

| Tool | Purpose |
|---|---|
| Biome | Linting and formatting |
| Vitest | Unit testing |
| Playwright | E2E testing (optional) |

## Architecture Decisions

### Why Astro?

- **Static-first**: Generates pure HTML/CSS/JS, no server runtime needed
- **Island Architecture**: Only hydrates interactive components (Preact), rest is static HTML
- **SEO**: Built-in sitemap, meta tags, clean URLs
- **Performance**: Zero JS by default, only ships JS for interactive islands
- **DX**: File-based routing, hot reload, TypeScript support

### Why Preact over React?

- **Size**: ~3KB vs ~40KB for React
- **API**: Same hooks API as React (useState, useEffect, etc.)
- **Compatibility**: Works with Astro's island architecture
- **Sufficient**: Tool UIs don't need React's full feature set

### Why Tailwind CSS v4?

- **Zero-runtime**: CSS is extracted at build time
- **Design system**: Easy to implement DESIGN.md tokens via `@theme`
- **Utility-first**: Rapid UI development without writing custom CSS
- **Tree-shaking**: Only includes classes used in the codebase

### Why Client-Side Only?

- **Privacy**: Files never leave the user's browser
- **Speed**: No upload/download latency
- **Cost**: No server infrastructure needed
- **Simplicity**: Static hosting (Cloudflare Pages, Vercel) is free

### Web APIs Used

| API | Used For |
|---|---|
| Canvas API | Image processing (convert, resize, compress, crop) |
| Web Crypto API | Hash generation (SHA-1/256/384/512) |
| File API | Reading uploaded files |
| Blob API | Creating downloadable files |
| Clipboard API | Copy to clipboard |
| URL.createObjectURL | Preview uploaded files |

## Performance Budget

| Metric | Target |
|---|---|
| First Contentful Paint | < 1s |
| Largest Contentful Paint | < 1.5s |
| Total JS per tool page | < 50KB gzip |
| Lighthouse Performance | > 95 |
| Lighthouse Accessibility | > 95 |
