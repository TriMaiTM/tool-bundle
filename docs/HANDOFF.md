# ToolBundle — Project Handoff Document

> Tài liệu bàn giao dự án cho AI agent session tiếp theo. Đọc kỹ file này trước khi bắt đầu làm việc.

---

## 1. TỔNG QUAN DỰ ÁN

**ToolBundle** là một web app tổng hợp các công cụ (tools) trực tuyến miễn phí, chạy 100% client-side (không upload file lên server). Tương tự như alltools.app nhưng với dark theme riêng.

- **Website**: Chưa deploy (local only)
- **Repository**: Chưa push lên GitHub
- **License**: MIT

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Astro | 5.x |
| UI Components | Preact | 10.x (~3KB) |
| Styling | Tailwind CSS | 4.x (dùng `@theme` directive) |
| Language | TypeScript | 5.x |
| Search | Fuse.js | client-side fuzzy search |
| PDF | pdf-lib | client-side PDF manipulation |
| YAML | js-yaml | YAML parsing |
| Markdown | marked | Markdown to HTML |

### Thiết kế

- **Theme**: Dark canvas (`#0a0a0a`) + Electric Yellow accent (`#faff69`)
- **Font**: Inter (body) + JetBrains Mono (code)
- **Design spec**: Xem file `DESIGN.md` ở root
- **Responsive**: Mobile-first, breakpoints tại 640px, 768px, 1024px

---

## 2. TRẠNG THÁI HIỆN TẠI

### Metrics

| Metric | Value |
|---|---|
| **Tổng tools** | 117 |
| **Tổng categories** | 16 |
| **Tổng pages** | 135 |
| **Tests** | 182 (all pass) |
| **JS per tool page** | ~6-10 KB gzip (code-split) |
| **Build time** | ~11s |
| **Bundle size** | ToolRenderer ~6KB gzip + mỗi tool 1-5KB gzip |

### 16 Categories hiện có

| # | Category | ID | Tools | Color |
|---|---|---|---|---|
| 1 | Image Tools | `image` | 13 | `#3b82f6` |
| 2 | Text Tools | `text` | 14 | `#22c55e` |
| 3 | Developer Tools | `developer` | 22 | `#a855f7` |
| 4 | PDF Tools | `pdf` | 5 | `#ef4444` |
| 5 | Math & Calculators | `math` | 5 | `#f59e0b` |
| 6 | Security Tools | `security` | 3 | `#06b6d4` |
| 7 | Color Tools | `color` | 4 | `#ec4899` |
| 8 | Date & Time Tools | `datetime` | 4 | `#14b8a6` |
| 9 | SEO & Marketing | `seo` | 3 | `#8b5cf6` |
| 10 | Data & Spreadsheet | `data` | 3 | `#10b981` |
| 11 | Fun & Utility | `fun` | 7 | `#f97316` |
| 12 | Education & Students | `education` | 7 | `#6366f1` |
| 13 | Finance & Money | `finance` | 7 | `#84cc16` |
| 14 | Health & Medical | `health` | 5 | `#f43f5e` |
| 15 | Video & Audio | `video` | 5 | `#d946ef` |
| 16 | AI Tools | `ai` | 10 | `#8b5cf6` |

### Danh sách đầy đủ 117 tools

Xem chi tiết tại `docs/tools-list.md`.

---

## 3. NHỮNG GÌ ĐÃ LÀM ĐƯỢC

### Phase 1-3: Core Tools (54 tools)
- Image tools (8): PNG↔JPG, PNG↔WebP, JPG↔PNG, JPG↔WebP, WebP↔PNG, Image Resizer, Image Compressor, Image Cropper
- Text tools (5): Word Counter, Case Converter, Slug Generator, Text Reverser, Line Counter
- Developer tools (6): JSON Formatter, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Regex Tester, Lorem Ipsum Generator
- PDF tools (5): PDF Merger, PDF Splitter, PDF Compressor, PDF Rotator, PDF to Text
- Math tools (5): Percentage Calculator, Unit Converter, BMI Calculator, Loan Calculator, Age Calculator
- Security tools (3): Password Generator, Password Strength Checker, OTP Generator

### Phase 4: Text & Developer Expansion (8 tools)
- Text: Text Repeater, Remove Duplicate Lines, Text Sorter, Reading Time Calculator
- Developer: Markdown to HTML, HTML to Markdown, CSS Formatter, YAML Formatter

### Phase 5: Image Expansion + Fun & Utility (15 tools)
- Image: Image to Base64, Image Rotator & Flipper, Image Watermark, Photo Filters, SVG Optimizer
- Developer: HTML Formatter, SQL Formatter, XML Formatter
- Fun & Utility (new category): Random Number Generator, Dice Roller, Coin Flipper, Random Name Picker, Wheel Spinner, Decision Maker, Placeholder Image Generator

### Phase 6: Text/Dev + Education (14 tools)
- Text: Fancy Text Generator, Readability Score, Text to Hashtags, Emoji Picker
- Developer: JavaScript Formatter, TypeScript to JS, Color System Generator
- Education (new category): Flashcard Maker, Quiz Maker, Grade Calculator, GPA Calculator, Citation Generator, Study Planner, Fraction Calculator

### Phase 7: Finance + Health + Video (17 tools)
- Finance (new category): Currency Converter, Compound Interest, Tax Calculator, Budget Tracker, Investment Calculator, Net Worth Calculator, Break Even Calculator
- Health (new category): Calorie Calculator, Water Intake Calculator, Sleep Cycle Calculator, Body Fat Calculator, Pregnancy Due Date
- Video & Audio (new category): Video to MP3, Audio Trimmer, Volume Booster, Audio Converter, Video Speed Changer

### Phase 8: AI Tools (11 tools)
- AI Tools (new category): OCR, Background Remover, Text Summarizer, Object Detection, Grammar Checker, Image Captioning, Sentiment Analysis, Question Answering, AI Translator, Speech to Text, Text to Speech
- Tech: Tesseract.js (OCR), @huggingface/transformers (Transformers.js) — ONNX Runtime WASM/WebGPU, Web Speech API (TTS)
- Features: lazy model loading, IndexedDB cache, progress bar, fallback models, 100% client-side

### Infrastructure & Features
- ✅ Astro SSG với dynamic routing (`/[category]/[tool]`)
- ✅ Code splitting — mỗi tool là 1 chunk riêng (lazy loading với `preact/compat.lazy`)
- ✅ Vendor chunks tách riêng (preact, pdf-lib, marked, js-yaml)
- ✅ Design system đầy đủ (colors, typography, spacing, components)
- ✅ Responsive Header với dropdown navigation + mobile menu
- ✅ Footer với categories links
- ✅ ToolLayout với breadcrumb, privacy badge, favorite button
- ✅ FileDropZone component (drag & drop file upload)
- ✅ Download utilities (blob, text, clipboard)
- ✅ Image processing utilities (Canvas API)
- ✅ Unit tests (182 tests, Vitest + jsdom)
- ✅ PWA (manifest.json, service worker, offline page, install prompt)
- ✅ Client-side search (Cmd+K, Fuse.js fuzzy search, recent searches)
- ✅ Favorites & History (localStorage, homepage section)

### Documentation
- ✅ `README.md` — Project overview, tech stack, getting started, available tools
- ✅ `DESIGN.md` — Full design system specification
- ✅ `docs/README.md` — Documentation index
- ✅ `docs/getting-started.md` — Installation, dev, build, deploy guide
- ✅ `docs/tech-stack.md` — Technologies and architecture decisions
- ✅ `docs/project-structure.md` — Directory layout and data flow
- ✅ `docs/adding-tools.md` — Step-by-step guide to add new tools
- ✅ `docs/tools-list.md` — Complete list of all 111 tools
- ✅ `docs/design-system.md` — UI components, colors, typography
- ✅ `docs/roadmap.md` — Phase 5-7 roadmap (all completed)
- ✅ `docs/strategy.md` — Future development strategy
- ✅ `docs/HANDOFF.md` — This file

---

## 4. NHỮNG GÌ CHƯA LÀM ĐƯỢC

### Features (theo strategy.md)

| Task | Phase | Status | Mô tả |
|---|---|---|---|
| Accessibility (a11y) | A5 | ❌ Chưa làm | ARIA labels, focus management, keyboard nav, screen reader |
| SEO improvements | C1 | ❌ Chưa làm | Blog section, structured data, Open Graph images, sitemap |
| Analytics | C3 | ❌ Chưa làm | Cloudflare Web Analytics hoặc Plausible |
| CI/CD | E2 | ❌ Chưa làm | GitHub Actions, auto deploy, Lighthouse CI |
| Ads integration | D1 | ❌ Chưa làm | Google AdSense / Carbon Ads |
| Premium tier | D2 | ❌ Chưa làm | No ads, API access, bulk processing |
| AI Tools | B3 | ✅ Done | 8 AI tools: OCR, BG Remover, Summarizer, Object Detection, Grammar, Captioning, Sentiment, QA |
| More categories | B1 | ❌ Chưa làm | CSS & Design, Social Media, Science, Home, Travel |

### Tools chưa implement (trong categories hiện có)

| Category | Tools tiềm năng |
|---|---|
| Image | Image Upscaler (AI), Favicon Generator, Image to ASCII |
| Developer | Docker Compose Generator, .gitignore Generator, .htaccess Generator, Regex Explainer |
| PDF | PDF Password Protection, PDF Annotator, PDF Metadata Editor |
| Security | QR Code Generator, Barcode Generator, AES Encrypt/Decrypt |
| Text | Text to Speech, Speech to Text, Translation, Palindrome Checker |
| Video | Screen Recorder, Webcam Recorder, GIF Maker |

---

## 5. CẤU TRÚC DỰ ÁN

```
ToolBundle/
├── public/
│   ├── icons/                    # PWA icons (SVG + PNG + screenshots)
│   ├── sw.js                     # Service Worker
│   └── manifest.json             # PWA manifest
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro      # Nav + dropdown + mobile menu
│   │   │   └── Footer.astro      # 4-column footer
│   │   ├── tools/
│   │   │   ├── ToolRenderer.tsx   # Dynamic tool loader (lazy imports)
│   │   │   ├── WordCounter.tsx    # ... và 99 tool components khác
│   │   │   └── ...
│   │   └── ui/
│   │       ├── FileDropZone.tsx   # Drag & drop file upload
│   │       ├── ToolCard.astro     # Tool card for listings
│   │       ├── ToolCardWithFavorite.tsx
│   │       ├── FavoriteButton.tsx
│   │       ├── FavoritesSection.tsx
│   │       └── SearchModal.tsx    # Cmd+K search
│   ├── data/
│   │   ├── categories.ts         # Category definitions (15 categories)
│   │   └── tools.ts              # Tool registry (100 tools metadata)
│   ├── layouts/
│   │   ├── Base.astro            # Root layout (head, header, footer, PWA, SW)
│   │   └── ToolLayout.astro      # Tool page layout (breadcrumb, favorite, history)
│   ├── pages/
│   │   ├── index.astro           # Homepage (hero, favorites, featured, categories)
│   │   ├── offline.astro         # Offline fallback page
│   │   └── [category]/
│   │       ├── index.astro       # Category listing
│   │       └── [tool].astro      # Dynamic tool page router
│   ├── styles/
│   │   └── global.css            # Design system tokens + component styles
│   └── utils/
│       ├── download.ts           # File download helpers
│       ├── image.ts              # Image processing (Canvas API)
│       ├── favorites.ts          # Favorites & history (localStorage)
│       ├── text.ts               # Text processing utilities (testable)
│       ├── math.ts               # Math calculation utilities (testable)
│       ├── color.ts              # Color conversion utilities (testable)
│       ├── csv.ts                # CSV parsing utilities (testable)
│       └── security.ts           # Security utilities (password, OTP, testable)
├── docs/                         # Documentation
├── DESIGN.md                     # Design system spec
├── vitest.config.ts              # Test config
├── astro.config.mjs              # Astro + Preact + Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json
└── .gitignore
```

---

## 6. CÁCH THÊM TOOL MỚI (3 BƯỚC)

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
    // Xử lý logic ở đây
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
// Thêm import (lazy)
const toolComponents = {
  // ...existing entries...
  "my-new-tool": lazy(() => import("./MyNewTool")),
};
```

Astro tự generate page tại `/{category}/{slug}`. Không cần tạo file page riêng.

---

## 7. NHỮNG LƯU Ý QUAN TRỌNG

### Khi thêm tool mới

1. **Dùng `class=` không phải `className=`** — Đây là Preact, không phải React
2. **Event handlers**: `onInput` cho input/textarea, `onChange` cho select
3. **Cast event targets**: `(e.target as HTMLTextAreaElement).value`
4. **Lazy loading**: Luôn dùng `lazy(() => import("./Component"))` trong ToolRenderer
5. **Không static import**: Nếu static import, tất cả 100+ tools sẽ bundled vào 1 file (~300KB gzip)

### CSS Classes có sẵn

| Class | Mô tả |
|---|---|
| `btn-primary` | Button vàng (primary CTA) |
| `btn-secondary` | Button dark có border |
| `textarea` | Multi-line input |
| `input` | Single-line input |
| `card` | Dark card container |
| `badge` | Pill badge |
| `badge-yellow` | Yellow pill badge |
| `drop-zone` | Drag & drop area |
| `code-block` | Monospace code output |
| `text-display-sm/md/lg/xl` | Display headings |
| `text-title-sm/md/lg` | Section titles |
| `text-body-sm/md` | Body text |
| `text-caption` | Small text |
| `text-caption-uppercase` | Labels |
| `text-primary` | Yellow text |
| `text-muted` | Gray text |
| `bg-surface-elevated` | Lighter dark bg |
| `bg-surface-card` | Card bg |

### Known Issues

1. **ToolRenderer bundle warning**: Vite warns "chunks larger than 500KB" — đây là tổng tất cả lazy chunks, KHÔNG phải 1 file. Mỗi tool page chỉ load ~6-10KB. Có thể ignore hoặc tăng `chunkSizeWarningLimit`.

2. **CompoundInterest.tsx**: Đã simplify formula display (tránh JSX syntax error với ký tự `×`). Nếu cần hiển thị công thức đầy đủ, dùng Unicode `×` trong string literal, không phải trong JSX expression.

3. **SVG icons cho PWA**: SVG icons không được support đầy đủ trên mọi platform. Đã tạo PNG fallback bằng `sharp`. Nếu build trên CI, cần cài `sharp` hoặc tạo PNG icons trước.

4. **Service Worker trong dev mode**: SW chỉ hoạt động khi build production (`npm run build && npm run preview`). Dev mode (`npm run dev`) không có SW.

5. **`@theme` directive trong Tailwind v4**: Các custom properties trong `@theme` block tự动生成 utility classes. Ví dụ `--color-primary: #faff69` tạo ra `bg-primary`, `text-primary`, `border-primary`. Nhưng một số components dùng inline styles vì Tailwind utilities không luôn hoạt động đúng trong Astro island context.

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

## 8. ROADMAP TƯƠNG LAI

Xem chi tiết tại `docs/strategy.md`. Tóm tắt:

### Ưu tiên cao (nên làm tiếp)

| Task | Effort | Mô tả |
|---|---|---|
| Accessibility (a11y) | 1 tuần | ARIA labels, keyboard nav, screen reader support |
| SEO improvements | 2-3 ngày | Structured data, Open Graph images, sitemap |
| Analytics | 1 ngày | Cloudflare Web Analytics (privacy-first) |
| Thêm 50+ tools | 2-3 tuần | Mở rộng categories hiện có |

### Ưu tiên trung bình

| Task | Effort | Mô tả |
|---|---|---|
| CI/CD | 1-2 ngày | GitHub Actions, auto deploy Cloudflare Pages |
| Blog section | 1 tuần | Astro Content Collections, SEO content |
| AI Tools | 2-3 tuần | Background Remover, OCR (ONNX Runtime Web) |

### Ưu tiên thấp (sau khi có traffic)

| Task | Effort | Mô tả |
|---|---|---|
| Ads integration | 1 tuần | AdSense / Carbon Ads |
| Premium tier | 1-2 tuần | No ads, API access |
| REST API | 2 tuần | API cho developers |

---

## 9. PROMPT CHO AI AGENT TIẾP THEO

Copy prompt dưới đây và paste vào session mới:

---

```
Tôi đang phát triển dự án ToolBundle — một web app tổng hợp 100+ tools miễn phí chạy 100% client-side (không upload file lên server). Tương tự alltools.app nhưng với dark theme.

## Tech Stack
- Astro 5 (SSG) + Preact 10 (~3KB) + Tailwind CSS 4 + TypeScript
- Code splitting: mỗi tool là 1 chunk riêng, lazy loaded
- Client-side only: Canvas API cho image, Web Crypto cho hash, pdf-lib cho PDF

## Trạng thái hiện tại
- 100 tools / 15 categories / 117 pages / 182 tests
- Features đã có: PWA, offline, Cmd+K search, favorites & history
- Docs đầy đủ trong thư mục docs/

## Đọc các file sau để hiểu dự án:
1. docs/HANDOFF.md — Tài liệu bàn giao (ĐỌC TRƯỚC)
2. docs/strategy.md — Chiến lược phát triển tương lai
3. docs/adding-tools.md — Hướng dẫn thêm tool mới
4. DESIGN.md — Design system specification

## Task tiếp theo (theo ưu tiên):
[Xem docs/strategy.md để biết task cụ thể]

## Lưu ý quan trọng khi làm việc:
1. Dùng `class=` không phải `className=` (Preact, không phải React)
2. ToolRenderer.tsx dùng `lazy(() => import("./Component"))` — KHÔNG static import
3. Mỗi tool là 1 file .tsx riêng trong src/components/tools/
4. Đăng ký tool trong src/data/tools.ts + src/components/tools/ToolRenderer.tsx
5. CSS classes: btn-primary, btn-secondary, textarea, input, card, badge, drop-zone
6. Chạy `npm run dev` để test, `npm run build` để verify production
7. Tests: `npm run test` (Vitest)
```

---

## 10. FILES QUAN TRỌNG CẦN ĐỌC

| File | Mục đích |
|---|---|
| `docs/HANDOFF.md` | Tài liệu bàn giao này |
| `docs/strategy.md` | Chiến lược phát triển |
| `docs/adding-tools.md` | Hướng dẫn thêm tool |
| `docs/tools-list.md` | Danh sách 100 tools |
| `DESIGN.md` | Design system |
| `src/data/tools.ts` | Tool registry |
| `src/data/categories.ts` | Category definitions |
| `src/components/tools/ToolRenderer.tsx` | Tool routing (lazy loading) |
| `src/layouts/Base.astro` | Root layout (PWA, SW, header, footer) |
| `src/layouts/ToolLayout.astro` | Tool page layout |
| `src/styles/global.css` | Design tokens |
| `astro.config.mjs` | Astro/Vite config |
| `vitest.config.ts` | Test config |
| `package.json` | Dependencies |

---

*Cập nhật lần cuối: 2026-05-03*
