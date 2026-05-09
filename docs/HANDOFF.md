# ToolBundle — Project Handoff Document

> Tài liệu bàn giao dự án cho AI agent session tiếp theo. Đọc kỹ file này trước khi bắt đầu làm việc.

---

## 1. TỔNG QUAN DỰ ÁN

**ToolBundle** là một web app tổng hợp các công cụ (tools) trực tuyến miễn phí, chạy 100% client-side (không upload file lên server). Tương tự như alltools.app nhưng với Pinterest-inspired design system.

- **Website**: https://toolbundle.pages.dev (Cloudflare Pages)
- **Repository**: GitHub (TriMaiTM/tool-bundle)
- **CI/CD**: GitHub Actions → Cloudflare Pages auto-deploy
- **License**: MIT

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Astro | 5.x (SSG) |
| UI Components | Preact | 10.x (~3KB) |
| Styling | Tailwind CSS | 4.x (`@theme` directive) |
| Language | TypeScript | 5.x |
| Search | Fuse.js | client-side fuzzy search |
| PDF | pdf-lib | client-side PDF manipulation |
| YAML | js-yaml | YAML parsing |
| Markdown | marked | Markdown to HTML |
| AI/ML | @huggingface/transformers | 3.8.1 (ONNX Runtime WASM/WebGPU) |
| OCR | tesseract.js | 5.x |
| QR Code | qrcode | 1.5.x |
| Barcode | jsbarcode | 3.x |
| ZIP | jszip | batch download |
| Linting | Biome | 1.9.4 |
| Testing | Vitest | 3.x |

### Design System (Pinterest-inspired)

- **Theme**: Light canvas (`#ffffff`) + Pinterest Red CTA (`#e60023`)
- **Dark Mode**: Warm dark canvas (`#161310`) + same red CTA
- **Font**: Inter (Pin Sans substitute) + JetBrains Mono (code)
- **Border Radius**: 8px (sm), 16px (md), 32px (lg), pill (full)
- **Design spec**: Xem file `DESIGN.md` ở root
- **Responsive**: Mobile-first, breakpoints tại 480px, 768px, 1024px, 1440px
- **Dark/Light toggle**: Floating button trên header, persist vào localStorage

---

## 2. TRẠNG THÁI HIỆN TẠI

### Metrics

| Metric | Value |
|---|---|
| **Tổng tools** | 160 |
| **Tổng categories** | 16 |
| **Tổng pages** | 181 |
| **Tests** | 182 (all pass) |
| **Lint errors** | 0 (Biome) |
| **JS per tool page** | ~6-10 KB gzip (code-split) |
| **Build time** | ~18s |

### 16 Categories hiện có

| # | Category | ID | Tools | Color |
|---|---|---|---|---|
| 1 | Image Tools | `image` | 13 | `#3b82f6` |
| 2 | Text Tools | `text` | 18 | `#22c55e` |
| 3 | Developer Tools | `developer` | 55 | `#a855f7` |
| 4 | PDF Tools | `pdf` | 5 | `#ef4444` |
| 5 | Math & Calculators | `math` | 5 | `#f59e0b` |
| 6 | Security Tools | `security` | 5 | `#06b6d4` |
| 7 | Color Tools | `color` | 7 | `#ec4899` |
| 8 | Date & Time Tools | `datetime` | 4 | `#14b8a6` |
| 9 | SEO & Marketing | `seo` | 3 | `#8b5cf6` |
| 10 | Data & Spreadsheet | `data` | 3 | `#10b981` |
| 11 | Fun & Utility | `fun` | 7 | `#f97316` |
| 12 | Education & Students | `education` | 7 | `#6366f1` |
| 13 | Finance & Money | `finance` | 7 | `#84cc16` |
| 14 | Health & Medical | `health` | 5 | `#f43f5e` |
| 15 | Video & Audio | `video` | 5 | `#d946ef` |
| 16 | AI Tools | `ai` | 11 | `#8b5cf6` |

### Danh sách đầy đủ 160 tools

Xem chi tiết tại `docs/tools-list.md`.

---

## 3. NHỮNG GÌ ĐÃ LÀM ĐƯỢC

### Phase 1-10: Core Tools (123 tools) — Đã hoàn thành trước session này

Xem chi tiết trong `docs/tools-list.md`.

### Phase 11: SEO & Discoverability ✅

| Task | Status | Chi tiết |
|---|---|---|
| Structured Data (JSON-LD) | ✅ | WebSite, CollectionPage, SoftwareApplication, BreadcrumbList, Organization |
| Open Graph tags | ✅ | og:title, og:description, og:url, og:type, og:site_name |
| Twitter Card tags | ✅ | twitter:card, twitter:title, twitter:description |
| Canonical URLs | ✅ | Mọi page có `<link rel="canonical">` |
| XML Sitemap | ✅ | @astrojs/sitemap auto-generate 181 URLs |
| robots.txt | ✅ | Allow all, link to sitemap |
| Meta descriptions | ✅ | Unique per page từ tool description |

**Files mới:** `src/utils/seo.ts`, `public/robots.txt`
**Files sửa:** `astro.config.mjs`, `Base.astro`, `ToolLayout.astro`, `index.astro`, `[category]/index.astro`

### Phase 12: Accessibility ✅

| Task | Status | Chi tiết |
|---|---|---|
| Focus-visible styles | ✅ | Yellow focus ring cho tất cả interactive elements |
| Skip-to-content link | ✅ | Visible on Tab press |
| ARIA labels | ✅ | Header nav, dropdown, mobile menu, search, favorites |
| Screen reader support | ✅ | role="dialog", role="listbox", aria-live regions |
| prefers-reduced-motion | ✅ | Disable animations |
| .sr-only utility | ✅ | Screen reader only content |

**Files sửa:** `global.css`, `Base.astro`, `Header.astro`, `Footer.astro`, `SearchModal.tsx`, `FavoriteButton.tsx`, `FavoritesSection.tsx`, `ToolCard.astro`

### Phase 13: Analytics ✅

| Task | Status | Chi tiết |
|---|---|---|
| Privacy-first analytics | ✅ | 100% localStorage, no cookies, no external requests |
| Page view tracking | ✅ | Every page load tracked |
| Tool usage tracking | ✅ | Tool view events tracked |
| Query functions | ✅ | getTopTools, getTopPages, getCategoryUsage |

**Files mới:** `src/utils/analytics.ts`
**Files sửa:** `Base.astro`, `ToolLayout.astro`

### Phase 14: CI/CD ✅

| Task | Status | Chi tiết |
|---|---|---|
| GitHub Actions workflow | ✅ | Lint → Test → Build → Deploy |
| Cloudflare Pages deploy | ✅ | Auto-deploy on push to main |
| Conditional deploy | ✅ | Only deploys when secrets configured |

**Files mới:** `.github/workflows/ci.yml`

### Phase 15: Blog Section ✅

| Task | Status | Chi tiết |
|---|---|---|
| Content Collections | ✅ | Astro content collection for blog |
| BlogLayout | ✅ | BlogPosting JSON-LD schema |
| Blog listing page | ✅ | /blog with post grid |
| Dynamic post pages | ✅ | /blog/[slug] |
| Prose styles | ✅ | Full markdown styling |
| Sample posts | ✅ | 3 posts: developer tools, image compression, text tools |
| Navigation links | ✅ | Blog link in Header + Footer |

**Files mới:** `src/content.config.ts`, `src/layouts/BlogLayout.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, 3 markdown posts
**Files sửa:** `global.css`, `Header.astro`, `Footer.astro`

### Phase 16: Converter Tools Batch 1 (20 tools) ✅

| Category | Tools |
|---|---|
| Number Systems (5) | Number Base Converter, Binary↔Decimal, Hex↔Decimal |
| Data Formats (4) | JSON↔XML, CSV↔XML |
| Text Encoding (4) | HTML Entity, Unicode, Text↔Binary, Punycode |
| Color (3) | HEX↔RGB, RGB↔HSL, Color Format Converter |
| Text & Fun (4) | Morse Code, Roman Numeral, Text to ASCII Art, Upside Down Text |

**Files mới:** 20 component files + `src/utils/batch.ts`, `src/components/ui/BatchResults.tsx`

### Phase 16b: Converter Tools Batch 2 (15 tools) ✅

| Category | Tools |
|---|---|
| Number/Math (5) | Binary↔Hex, Number to Words, Scientific Notation, Octal Converter |
| Data Format (3) | TOML↔JSON, YAML→JSON |
| Encoding (4) | Base32, Text↔Hex, ROT13, Quoted-Printable |
| Time & Other (3) | Seconds↔Time, HTML to Text |

**Files mới:** 15 component files

### Phase 17: Batch Processing ✅

| Task | Status | Chi tiết |
|---|---|---|
| Batch utilities | ✅ | ZIP download, file helpers |
| BatchResults component | ✅ | Progress bar, file list, Download All |
| Image Converter batch mode | ✅ | Toggle single/batch, multi-file upload |
| Works on all 5 image converters | ✅ | PNG↔JPG↔WebP |

**Files mới:** `src/utils/batch.ts`, `src/components/ui/BatchResults.tsx`
**Files sửa:** `src/components/tools/ImageConverter.tsx`

### Phase 18: AI Assistant ✅

| Task | Status | Chi tiết |
|---|---|---|
| Knowledge base | ✅ | 80+ tools with keywords, descriptions, use cases |
| Pattern matching engine | ✅ | Intent detection + tool matching |
| Chat UI component | ✅ | Floating button, modal, quick actions |
| Smart responses | ✅ | Direct tool links, category listings, recommendations |
| Keyboard support | ✅ | Enter to send, Escape to close |

**Files mới:** `src/utils/ai-assistant.ts`, `src/components/ui/AIAssistant.tsx`
**Files sửa:** `Base.astro` (import + client:idle)

### Phase 19: Workflow Builder (Canvas Editor) ✅

| Task | Status | Chi tiết |
|---|---|---|
| Workflow engine | ✅ | 25 compatible tools, topological sort, sequential execution |
| Visual canvas editor | ✅ | n8n-style drag-and-drop nodes + SVG edges |
| Sidebar tool picker | ✅ | Drag tools onto canvas |
| Pre-built templates | ✅ | 6 workflow templates |
| Zoom/Pan | ✅ | Mouse wheel zoom, drag to pan |
| Node connections | ✅ | Drag from output port to input port |
| Input/Output panel | ✅ | Toggle panel for text input/output |
| Navigation link | ✅ | "Workflow" in Header nav |

**Files mới:** `src/utils/workflow.ts`, `src/components/workflow/WorkflowBuilder.tsx`, `src/components/workflow/WorkflowCanvasEditor.tsx`
**Files sửa:** `src/data/tools.ts`, `src/components/tools/ToolRenderer.tsx`, `Header.astro`

### Design System Overhaul ✅

| Task | Status | Chi tiết |
|---|---|---|
| Pinterest-inspired design | ✅ | Light canvas, red CTA, 16px radius |
| Dark mode | ✅ | Warm dark (#161310), toggle button |
| Theme persistence | ✅ | localStorage + prefers-color-scheme |
| No flash on load | ✅ | Inline script in head applies theme before CSS |
| @custom-variant dark | ✅ | Tailwind CSS 4 data-theme support |

**Files sửa:** `global.css`, `Base.astro`, `Header.astro`, `FavoriteButton.tsx`, `FavoritesSection.tsx`, `SearchModal.tsx`, `sw.js`

### Biome Linter Setup ✅

| Task | Status | Chi tiết |
|---|---|---|
| biome.json config | ✅ | Project-appropriate rules, disabled false positives |
| Pre-commit hooks | ✅ | husky + lint-staged auto-format on commit |
| Format on save | ✅ | All files formatted to biome style |

**Files mới:** `biome.json`
**Files sửa:** `package.json`, `.husky/pre-commit`

---

## 4. CẤU TRÚC DỰ ÁN

```
ToolBundle/
├── .github/workflows/ci.yml    # CI/CD pipeline
├── biome.json                   # Linter config
├── public/
│   ├── icons/                   # PWA icons
│   ├── sw.js                    # Service Worker (v3)
│   ├── manifest.json            # PWA manifest
│   ├── robots.txt               # SEO robots
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro     # Nav + search + theme toggle + workflow link
│   │   │   └── Footer.astro     # 4-column footer
│   │   ├── tools/
│   │   │   ├── ToolRenderer.tsx  # Dynamic tool loader (lazy imports, 160 tools)
│   │   │   ├── *.tsx            # 160 tool components
│   │   │   └── ImageConverter.tsx # Shared image converter with batch mode
│   │   ├── ui/
│   │   │   ├── AIAssistant.tsx   # Floating AI chat widget
│   │   │   ├── BatchResults.tsx  # Batch processing results UI
│   │   │   ├── FavoriteButton.tsx # Favorite toggle button
│   │   │   ├── FavoritesSection.tsx # Favorites & recent tools section
│   │   │   ├── FileDropZone.tsx  # Drag & drop file upload
│   │   │   ├── SearchModal.tsx   # Cmd+K search modal
│   │   │   ├── ToolCard.astro    # Tool card for listings
│   │   │   └── ToolCardWithFavorite.tsx
│   │   └── workflow/
│   │       ├── WorkflowBuilder.tsx      # Step-by-step workflow builder
│   │       └── WorkflowCanvasEditor.tsx # n8n-style canvas editor
│   ├── data/
│   │   ├── categories.ts        # 16 category definitions
│   │   └── tools.ts             # 160 tool metadata registry
│   ├── layouts/
│   │   ├── Base.astro           # Root layout (head, header, footer, PWA, analytics, AI)
│   │   ├── ToolLayout.astro     # Tool page layout (breadcrumb, favorite, analytics)
│   │   └── BlogLayout.astro     # Blog post layout (JSON-LD, breadcrumb)
│   ├── pages/
│   │   ├── index.astro          # Homepage (hero, featured, favorites, all tools A-Z, categories)
│   │   ├── offline.astro        # Offline fallback page
│   │   ├── blog/
│   │   │   ├── index.astro      # Blog listing page
│   │   │   └── [slug].astro     # Dynamic blog post page
│   │   └── [category]/
│   │       ├── index.astro      # Category listing page
│   │       └── [tool].astro     # Dynamic tool page router
│   ├── content/
│   │   └── blog/                # Blog posts (markdown)
│   ├── styles/
│   │   └── global.css           # Design system tokens + component styles + dark mode
│   └── utils/
│       ├── ai-assistant.ts      # AI assistant knowledge base + matching
│       ├── ai.ts                # AI utilities (encodeWAV, resizeImage)
│       ├── analytics.ts         # Privacy-first analytics
│       ├── batch.ts             # Batch processing utilities (ZIP download)
│       ├── color.ts             # Color conversion utilities
│       ├── csv.ts               # CSV parsing utilities
│       ├── download.ts          # File download helpers
│       ├── favorites.ts         # Favorites & history management
│       ├── image.ts             # Image processing (Canvas API)
│       ├── math.ts              # Math calculation utilities
│       ├── security.ts          # Security utilities (password, OTP)
│       ├── seo.ts               # SEO utilities (JSON-LD generators)
│       ├── text.ts              # Text processing utilities
│       └── workflow.ts          # Workflow engine + tool registry
├── docs/                        # Documentation
├── DESIGN.md                    # Design system spec (Pinterest-inspired)
├── vitest.config.ts
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## 5. CÁCH THÊM TOOL MỚI (3 BƯỚC)

### Bước 1: Đăng ký tool trong `src/data/tools.ts`

```typescript
{
  id: "my-new-tool",
  name: "My New Tool",
  description: "What this tool does.",
  category: "text",            // Phải match category ID trong categories.ts
  icon: "wand",                // Lucide icon name
  slug: "my-new-tool",         // URL: /text/my-new-tool
  featured: true,              // (optional) Hiện trên homepage
  tags: ["tag1", "tag2"],      // (optional) Cho search
}
```

### Bước 2: Tạo component `src/components/tools/MyNewTool.tsx`

```tsx
import { useState, useMemo, useCallback } from "preact/hooks";

export default function MyNewTool() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input) return "";
    return input.toUpperCase();
  }, [input]);

  return (
    <div>
      <textarea class="textarea" value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)} />
      <textarea class="textarea" value={result} readOnly />
    </div>
  );
}
```

### Bước 3: Đăng ký trong `src/components/tools/ToolRenderer.tsx`

```tsx
const toolComponents = {
  "my-new-tool": lazy(() => import("./MyNewTool")),
};
```

### Bước 4: Verify

```bash
npm run build
npm run test
npx biome check src/
```

---

## 6. NHỮNG LƯU Ý QUAN TRỌNG

### Khi thêm tool mới

1. **Dùng `class=` không phải `className=`** — Đây là Preact, không phải React
2. **Event handlers**: `onInput` cho input/textarea, `onChange` cho select
3. **Cast event targets**: `(e.target as HTMLTextAreaElement).value`
4. **Lazy loading**: Luôn dùng `lazy(() => import("./Component"))` trong ToolRenderer
5. **Không static import**: Nếu static import, tất cả 160 tools sẽ bundled vào 1 file
6. **String concatenation** thay vì template literals cho backslash characters (tránh SSR issues)
7. **CSS variables** cho colors — KHÔNG dùng hardcoded hex trong inline styles (tránh hydration mismatch)

### CSS Classes có sẵn

| Class | Mô tả |
|---|---|
| `btn-primary` | Red CTA button |
| `btn-secondary` | Gray-cream button |
| `btn-tertiary` | Ghost/link button |
| `textarea` | Multi-line input |
| `input` | Single-line input |
| `card` | White card with border |
| `card-soft` | Surface-card background |
| `badge` | Pill badge (surface-card) |
| `badge-red` | Red pill badge |
| `drop-zone` | Drag & drop area |
| `code-block` | Monospace code output |
| `search-bar` | Pill-shaped search input |
| `filter-chip` | Pill filter button |
| `pin-card` | Rounded card (16px) |
| `feature-card` | White feature card |
| `category-tile` | Category card |
| `sr-only` | Screen reader only |
| `skip-to-content` | Skip navigation link |
| `text-display-xl/lg/md/sm` | Display typography |
| `text-heading-xl/lg/md` | Heading typography |
| `text-body-md/sm` | Body typography |
| `text-body-strong/sm-strong` | Bold body typography |
| `text-caption` | Caption text |
| `text-link` | Inline link style |
| `.prose` | Blog content styles |

### Dark Mode

- CSS variables auto-switch via `[data-theme="dark"]` selector
- `@custom-variant dark` configured for Tailwind CSS 4
- Theme persisted in `localStorage` key `toolbundle_theme`
- Respects `prefers-color-scheme` as default
- Inline script in `<head>` prevents flash of wrong theme
- Toggle button in Header (sun/moon icons)

### Known Issues

1. **ToolRenderer bundle warning**: Vite warns "chunks larger than 500KB" — đây là tổng tất cả lazy chunks (bao gồm Transformers.js runtime ~894KB), KHÔNG phải 1 file. Mỗi tool page chỉ load ~6-10KB.
2. **AI Models gating**: Một số models trên HuggingFace là gated (cần auth). Các models đang dùng đều public.
3. **Transformers.js Float32Array bug**: SpeechT5 model có bug nội bộ. Đã fix bằng Web Speech API fallback.
4. **Service Worker trong dev mode**: SW chỉ hoạt động khi build production (`npm run build && npm run preview`).
5. **Biome organizeImports**: TẮT — vì nó xóa imports dùng trong Astro templates (không hiểu JSX usage trong .astro files).

### Scripts

```bash
npm run dev          # Start dev server (localhost:4321)
npm run build        # Build static site → dist/
npm run preview      # Preview production build
npm run test         # Run unit tests (Vitest)
npm run lint         # Lint with Biome
npm run format       # Format with Biome
```

---

## 7. ROADMAP TƯƠNG LAI

### Ưu tiên cao (nên làm tiếp)

| Task | Effort | Mô tả |
|---|---|---|
| Thêm 30-50 tools mới | 2-3 tuần | Mở rộng categories: Developer, Image, PDF, Security, Text |
| SEO content (blog posts) | Ongoing | 5-10 bài SEO articles mỗi tháng |
| AI Tools Batch 2 | 2-3 tuần | NER, Face Detection, Paraphrase, Language Detection, Keyword Extraction |

### Ưu tiên trung bình

| Task | Effort | Mô tả |
|---|---|---|
| Video Tools Expansion | 1 tuần | Screen Recorder, Webcam Recorder, GIF Maker |
| Design Tools | 1 tuần | CSS Animation, Glassmorphism, Neumorphism, Gradient Text, Clip-Path |
| Productivity Tools | 2 tuần | Pomodoro Timer, Kanban Board, Markdown Notes, Checklist |

### Ưu tiên thấp (sau khi có traffic)

| Task | Effort | Mô tả |
|---|---|---|
| Monetization | 1-2 tuần | AdSense / Carbon Ads integration |
| Premium tier | 1-2 tuần | No ads, API access, priority support |
| REST API | 2 tuần | API cho developers, rate limiting |
| AI-powered Workflow Builder | 2 tuần | NLP-based workflow suggestion từ chat |

---

## 8. PROMPT CHO AI AGENT TIẾP THEO

Copy prompt dưới đây và paste vào session mới:

```
Tôi đang phát triển dự án ToolBundle — một web app tổng hợp 160+ tools miễn phí chạy 100% client-side.

## Tech Stack
- Astro 5 (SSG) + Preact 10 (~3KB) + Tailwind CSS 4 + TypeScript
- Code splitting: mỗi tool là 1 chunk riêng, lazy loaded
- AI: @huggingface/transformers 3.8.1 + tesseract.js 5.x
- QR/Barcode: qrcode + jsbarcode
- Batch: jszip
- Lint: Biome 1.9.4 + husky + lint-staged
- Deploy: Cloudflare Pages (GitHub Actions CI/CD)

## Trạng thái hiện tại
- 160 tools / 16 categories / 181 pages / 182 tests
- Design: Pinterest-inspired light theme + dark mode toggle
- Features: PWA, offline, Cmd+K search, favorites & history, AI assistant, batch processing
- SEO: JSON-LD, OG tags, sitemap, robots.txt
- Accessibility: ARIA labels, focus-visible, skip-to-content, prefers-reduced-motion
- Analytics: Privacy-first localStorage tracking
- Blog: Content Collections + 3 sample posts
- CI/CD: GitHub Actions → Cloudflare Pages
- Workflow Builder: n8n-style canvas editor với 25 workflow-compatible tools
- Converter Tools: 35 converter tools (number, data format, encoding, color, text, time)
- AI Assistant: Rule-based chat widget với 80+ tool knowledge base

## Đọc các file sau để hiểu dự án:
1. docs/HANDOFF.md — Tài liệu bàn giao (ĐỌC TRƯỚC)
2. docs/tools-list.md — Danh sách đầy đủ 160 tools
3. docs/adding-tools.md — Hướng dẫn thêm tool mới
4. docs/ai-tools-research.md — Nghiên cứu AI tools
5. DESIGN.md — Design system specification (Pinterest-inspired)

## Lưu ý quan trọng khi làm việc:
1. Dùng `class=` không phải `className=` (Preact, không phải React)
2. ToolRenderer.tsx dùng `lazy(() => import("./Component"))` — KHÔNG static import
3. Mỗi tool là 1 file .tsx riêng trong src/components/tools/
4. Đăng ký tool trong src/data/tools.ts + src/components/tools/ToolRenderer.tsx
5. CSS classes: btn-primary, btn-secondary, textarea, input, card, badge, drop-zone, search-bar, filter-chip
6. CSS variables cho colors — KHÔNG dùng hardcoded hex trong inline styles
7. String concatenation thay vì template literals cho backslash characters (tránh SSR issues)
8. Chạy `npm run dev` để test, `npm run build` để verify production
9. Tests: `npm run test` (Vitest)
10. Lint: `npx biome check src/` — fix: `npx biome check --fix --unsafe src/`
11. Format: `npx biome format --write src/`
12. Pre-commit hook tự động format — không cần manual format trước khi commit
13. AI tools dùng @huggingface/transformers — models cache vào IndexedDB
14. Dark mode dùng data-theme="dark" attribute trên <html> + @custom-variant dark cho Tailwind
15. Theme init script trong <head> Base.astro ngăn flash of wrong theme
16. Service Worker version trong public/sw.js — bump version khi đổi CSS/JS
17. Biome organizeImports TẮT — nó xóa imports dùng trong Astro templates
```

---

## 9. FILES QUAN TRỌNG CẦN ĐỌC

| File | Mục đích |
|---|---|
| `docs/HANDOFF.md` | Tài liệu bàn giao này |
| `docs/tools-list.md` | Danh sách 160 tools |
| `docs/adding-tools.md` | Hướng dẫn thêm tool |
| `docs/ai-tools-research.md` | Nghiên cứu AI tools |
| `docs/strategy.md` | Chiến lược phát triển |
| `DESIGN.md` | Design system (Pinterest-inspired) |
| `src/data/tools.ts` | Tool registry (160 tools) |
| `src/data/categories.ts` | Category definitions (16 categories) |
| `src/components/tools/ToolRenderer.tsx` | Tool routing (lazy loading) |
| `src/utils/workflow.ts` | Workflow engine + tool registry |
| `src/utils/ai-assistant.ts` | AI assistant knowledge base |
| `src/utils/analytics.ts` | Analytics utilities |
| `src/utils/seo.ts` | SEO utilities |
| `src/layouts/Base.astro` | Root layout (PWA, SW, header, footer, analytics, AI) |
| `src/styles/global.css` | Design tokens + component styles + dark mode |
| `astro.config.mjs` | Astro/Vite config |
| `biome.json` | Linter config |
| `vitest.config.ts` | Test config |
| `package.json` | Dependencies |
| `.github/workflows/ci.yml` | CI/CD pipeline |

---

*Cập nhật lần cuối: 2026-05-09*
