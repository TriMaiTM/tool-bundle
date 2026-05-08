# ToolBundle — Chiến lược phát triển

Tài liệu này vạch ra hướng phát triển tiếp theo cho ToolBundle, từ technical improvements đến growth strategy.

## Trạng thái hiện tại

| Metric | Value |
|---|---|
| Tools | 123 |
| Categories | 16 |
| Pages | 141 |
| Tests | 182 |
| JS per page | ~6-10 KB gzip |
| Build time | ~13s |

---

## Phase A — Nền tảng kỹ thuật ✅ DONE

**Trạng thái:** Đã hoàn thành tất cả.

- ✅ PWA & Offline Support (manifest.json, service worker, offline page)
- ✅ Client-side Search (Cmd+K, Fuse.js, recent searches)
- ✅ Favorites & History (localStorage)
- ✅ Keyboard Shortcuts (Cmd+K)
- ✅ Accessibility (a11y) — chưa làm

### A1. PWA & Offline Support

**Tại sao:** Tool aggregator rất phù hợp với PWA. User cài vào desktop/mobile như app, dùng offline. Đây là điểm mạnh lớn so với competitors.

**Cần làm:**
- [ ] Tạo `manifest.json` với icons đầy đủ (192x192, 512x512)
- [ ] Service Worker với Workbox:
  - Cache static assets (HTML, CSS, JS, fonts)
  - Cache-first strategy cho tool pages
  - Network-first strategy cho data (future API calls)
- [ ] Offline fallback page
- [ ] Install prompt (beforeinstallprompt event)
- [ ] Splash screen với brand colors

**Libraries:**
- `@vite-pwa/plugin` hoặc manual Workbox setup

### A2. Client-Side Search

**Tại sao:** 100+ tools, user cần tìm nhanh. Không cần server-side search.

**Cần làm:**
- [ ] Tích hợp Pagefind (static search, zero runtime cost)
- [ ] Hoặc implement custom search với Fuse.js (client-side fuzzy search)
- [ ] Cmd+K search modal (đã có UI placeholder trong Header)
- [ ] Search theo: tool name, description, tags, category
- [ ] Recent searches (localStorage)
- [ ] Search suggestions

**Approach:**
- Pagefind: index build-time, zero JS runtime, rất nhẹ
- Fuse.js: client-side, ~6KB, fuzzy matching

### A3. Favorites & History

**Tại sao:** User thường dùng đi dùng lại cùng một vài tools. Favorites giúp truy cập nhanh.

**Cần làm:**
- [ ] Favorite button trên mỗi tool page và tool card
- [ ] Favorites section trên homepage
- [ ] Recently visited tools (last 20)
- [ ] Lưu vào localStorage
- [ ] Export/import favorites (JSON)

### A4. Keyboard Shortcuts

**Tại sao:** Power users đánh giá cao keyboard shortcuts.

**Cần làm:**
- [ ] `Cmd/Ctrl + K` — Open search
- [ ] `Esc` — Close modal/search
- [ ] `Cmd/Ctrl + C` — Copy output (trong tool context)
- [ ] Shortcut hints trong UI

### A5. Accessibility (a11y)

**Tại sao:** WCAG compliance quan trọng cho SEO và user inclusivity.

**Cần làm:**
- [ ] ARIA labels cho tất cả interactive elements
- [ ] Focus management cho modals
- [ ] Keyboard navigation cho tất cả tools
- [ ] Color contrast đảm bảo WCAG AA (đã có Contrast Checker tool)
- [ ] Screen reader testing
- [ ] Skip-to-content link

---

## Phase B — Nội dung & Categories mới (liên tục)

Mục tiêu: Mở rộng lên 200+ tools, thêm categories theo nhu cầu thực tế.

### B1. Categories mới (theo thứ tự ưu tiên)

| # | Category | Tools ước tính | Độ khó | Lý do ưu tiên |
|---|---|---|---|---|
| 16 | CSS & Design | 10-15 | TB | Dev tools mở rộng, nhiều nhu cầu |
| 17 | Social Media | 5-8 | Dễ | Fake generators, image sizing |
| 18 | Science & Engineering | 5-8 | TB | Niche nhưng loyal users |
| 19 | Home & Lifestyle | 5-8 | Dễ | Paint, cooking, gardening calculators |
| 20 | Travel & Geography | 5-8 | Dễ | Distance, timezone, currency |

### B2. Mở rộng categories hiện có

| Category | Tools mới tiềm năng | Ưu tiên |
|---|---|---|
| Image | Image Upscaler (AI), Favicon Generator, Image to ASCII | Cao |
| Developer | Docker Compose Generator, .gitignore Generator, Regex Explainer | Cao |
| PDF | PDF Password Protection, PDF Merge with Preview | TB |
| Security | QR Code Generator, Barcode Generator, AES Encrypt | Cao |
| Text | Text to Speech, Speech to Text, Translation | TB |
| Video | Screen Recorder, Webcam Recorder, GIF Maker | TB |

### B3. AI Tools (tách riêng) ✅ DONE

**Trạng thái:** Đã hoàn thành 8 AI tools chạy 100% client-side.

**Đã implement:**
- ✅ OCR — Image to Text (Tesseract.js)
- ✅ Background Remover (RMBG-1.4 + Transformers.js)
- ✅ Text Summarizer (distilbart-cnn-6-6 + Transformers.js)
- ✅ Object Detection (detr-resnet-50 + Transformers.js)
- ✅ Grammar Checker (T5-small + Transformers.js)
- ✅ Image Captioning (vit-gpt2 + Transformers.js)
- ✅ Sentiment Analysis (DistilBERT SST-2 + Transformers.js)
- ✅ Question Answering (DistilBERT QA + Transformers.js)

**Architecture:**
- Models load lazy (chỉ khi user mở AI tool)
- Progress bar cho model download
- IndexedDB cache cho models (download 1 lần, dùng mãi)
- Fallback models nếu primary fail

**Cần làm thêm:**
- Image Upscaler (Real-ESRGAN)
- Face Detection/Blur
- Text Translation

---

## Phase C — Growth & SEO (song song với Phase A/B)

Mục tiêu: Tăng organic traffic, build community.

### C1. SEO Strategy

**Technical SEO (đã có):**
- ✅ Static HTML (Astro SSG)
- ✅ Clean URLs (`/text/word-counter`)
- ✅ Fast loading (< 1s FCP)
- Cần thêm: Sitemap auto-generation, robots.txt, canonical URLs

**Content SEO:**
- [ ] Blog section với Astro Content Collections
- [ ] Bài viết hướng dẫn: "How to compress images without losing quality"
- [ ] Tool comparison pages: "Best free online JSON formatters"
- [ ] FAQ schema markup cho mỗi tool page
- [ ] Breadcrumb schema markup

**On-Page SEO:**
- [ ] Meta descriptions cho mỗi tool (đã có trong tool data)
- [ ] Open Graph images (auto-generated với Satori)
- [ ] Structured data (SoftwareApplication schema)
- [ ] Internal linking strategy (related tools)

### C2. Social & Community

- [ ] GitHub repo (open source)
- [ ] "Suggest a Tool" page (Google Form hoặc GitHub Issues)
- [ ] Changelog page (từ Changesets)
- [ ] Twitter/X account cho updates
- [ ] Reddit posts trong r/webdev, r/SideProject

### C3. Analytics & Monitoring

- [ ] Cloudflare Web Analytics (privacy-first, không cookie)
- Hoặc Plausible Analytics (self-hosted option)
- [ ] Track: page views, tool usage, popular tools, bounce rate
- [ ] Error monitoring (Sentry free tier)
- [ ] Performance monitoring (Lighthouse CI)

---

## Phase D — Monetization (sau khi có traffic)

Mục tiêu: Tạo revenue mà không ảnh hưởng UX.

### D1. Advertising (Primary Revenue)

**Approach:** Non-intrusive ads, không popups, không interstitials.

- [ ] Banner ads: dưới tool output (không phải trước tool)
- [ ] Sidebar ads (desktop only)
- [ ] Google AdSense hoặc Carbon Ads (developer audience)
- [ ] Premium: Remove ads ($3/month hoặc $25/year)

### D2. Premium Features (Optional)

**Free tier:** Tất cả tools, có ads
**Premium tier:** 
- No ads
- Priority support
- API access (see D3)
- Bulk processing (batch mode cho tất cả tools)
- Custom branding (white-label)
- Export history

**Pricing:** $5/month hoặc $40/year

### D3. API Access

**Tại sao:** Developers muốn tích hợp tools vào workflow.

- [ ] REST API cho các conversion tools
- [ ] Rate limiting: Free = 100 req/day, Premium = 10K req/day
- [ ] API key management
- [ ] Documentation với examples
- [ ] Pricing: Free tier + paid plans

---

## Phase E — Technical Debt & DX (liên tục)

Mục tiêu: Maintain code quality khi scale lên 200+ tools.

### E1. Testing

- [ ] Tăng test coverage lên 90%+
- [ ] Component smoke tests (render mỗi tool không crash)
- [ ] E2E tests với Playwright (critical flows: upload → process → download)
- [ ] Visual regression tests (tùy chọn)
- [ ] Performance budgets trong CI

### E2. CI/CD

- [ ] GitHub Actions:
  - Build & test trên mỗi PR
  - Lighthouse CI check
  - Auto-deploy lên Cloudflare Pages on merge
  - Auto-generate changelog từ Changesets
- [ ] Branch protection rules
- [ ] PR preview deployments

### E3. Code Quality

- [ ] Biome lint rules (đã có)
- [ ] Strict TypeScript (đã có)
- [ ] Component documentation (Storybook hoặc Ladle — optional)
- [ ] Performance budgets: mỗi tool chunk < 10KB gzip
- [ ] Bundle analysis trong CI

### E4. Developer Experience

- [ ] Contribution guide (CONTRIBUTING.md)
- [ ] Tool template generator (CLI script)
- [ ] Hot module reload hoạt động mượt mà
- [ ] Error boundaries cho tool components

---

## Ưu tiên thực hiện

| Ưu tiên | Phase | Task | Impact | Effort |
|---|---|---|---|---|
| 🔴 Cao | A2 | Client-side search | UX++ | 1-2 ngày |
| 🔴 Cao | A1 | PWA + Offline | UX++ | 2-3 ngày |
| 🔴 Cao | A3 | Favorites & History | UX++ | 1 ngày |
| 🔴 Cao | C1 | SEO improvements | Growth++ | 2-3 ngày |
| 🟡 TB | B1 | Thêm 50 tools | Content++ | 2-3 tuần |
| 🟡 TB | A5 | Accessibility | Quality++ | 1 tuần |
| 🟡 TB | C3 | Analytics setup | Data++ | 1 ngày |
| 🟢 Thấp | D1 | Ads integration | Revenue | 1 tuần |
| 🟢 Thấp | B3 | AI Tools | Differentiation | 2-3 tuần |
| 🟢 Thấp | E2 | CI/CD | DX | 1-2 ngày |

---

## KPIs mục tiêu (6 tháng)

| Metric | Hiện tại | Mục tiêu 6 tháng |
|---|---|---|
| Tools | 100 | 200+ |
| Categories | 15 | 20+ |
| Monthly visitors | 0 | 10K+ |
| Lighthouse score | ~95 | 98+ |
| Test coverage | 182 tests | 500+ |
| PWA install rate | 0% | 5% |
| Bounce rate | N/A | < 40% |
| Avg session duration | N/A | > 2 min |

---

## Tóm tắt roadmap

```
Phase A (2-3 tuần):  PWA, Search, Favorites, Keyboard, A11y
Phase B (liên tục):  Mở rộng tools lên 200+, thêm categories
Phase C (song song): SEO, Content, Social, Analytics
Phase D (sau traffic): Ads, Premium, API
Phase E (liên tục):  Testing, CI/CD, Code quality
```

**Next action:** Bắt đầu với Phase A2 (Search) vì impact cao nhất, effort thấp nhất.
