# ToolBundle Roadmap

Kế hoạch phát triển ToolBundle — từ 100 tools ban đầu đến 226 tools hiện tại.

---

## Trạng thái hiện tại

| Metric | Value |
|---|---|
| **Total tools** | 226 |
| **Categories** | 19 |
| **Pages** | 254 |
| **Tests** | 182+ (all pass) |
| **Lint errors** | 0 (Biome) |
| **Build time** | ~24s |
| **AI Tools** | 15 |
| **SW Version** | v4 |

---

## Các Phase đã hoàn thành

### Phase 1-10: Core Tools (123 tools) ✅

Xem chi tiết trong `docs/tools-list.md`.

### Phase 11-15: Infrastructure ✅

| Phase | Focus | Status |
|---|---|---|
| Phase 11 | SEO & Discoverability (JSON-LD, OG tags, sitemap) | ✅ |
| Phase 12 | Accessibility (ARIA, focus-visible, skip-to-content) | ✅ |
| Phase 13 | Privacy-first Analytics (localStorage) | ✅ |
| Phase 14 | CI/CD (GitHub Actions → Cloudflare Pages) | ✅ |
| Phase 15 | Blog Section (Content Collections) | ✅ |

### Phase 16-19: Features & Converters ✅

| Phase | Focus | Tools/Features | Status |
|---|---|---|---|
| Phase 16 | Converter Tools Batch 1 | 20 tools (Number, Data, Encoding, Color, Text) | ✅ |
| Phase 16b | Converter Tools Batch 2 | 15 tools (Number/Math, Data, Encoding, Time) | ✅ |
| Phase 17 | Batch Processing | Image batch mode, ZIP download | ✅ |
| Phase 18 | AI Assistant | Rule-based chat, 80+ tool knowledge base | ✅ |
| Phase 19 | Workflow Builder | Canvas editor, 25 tools, 6 templates | ✅ |

### Phase 20: AI Tools Batch 2 ✅

| Tool | Model | Task |
|---|---|---|
| Named Entity Recognition | `Xenova/bert-base-NER` | token-classification |
| Face Detection | `Xenova/detr-resnet-50` | object-detection |
| Paraphrase Generator | `Xenova/t5-small` | text2text-generation |
| Language Detector | Heuristic (Unicode) | instant detection |
| Keyword Extractor | `Xenova/all-MiniLM-L6-v2` | feature-extraction |

**Result:** 11 → 16 AI tools

### Phase 21: Tool Collections ✅

| Feature | Description |
|---|---|
| Collections utility | localStorage CRUD, add/remove tools, import/export JSON |
| CollectionManager | Grid cards with accent bar, expand/collapse, inline edit |
| CollectionPicker | Dropdown on tool pages, checkbox toggle, create new |
| CollectionsSection | Homepage section, 3 suggested collections |
| Design | Accent card style with icon, badge, hover lift |

### Phase 22: Converter/Developer Tools Expansion ✅

| Category | Tools Added |
|---|---|
| Text (+5) | Find & Replace, Whitespace Remover, Text Statistics, Text Wrap, Text Truncate |
| Developer (+6) | CSS Units Converter, URL Parser, User Agent Parser, MIME Type Lookup, HTTP Status Codes, CSS Minifier |
| Data (+3) | JSON to YAML, TSV to JSON, JSON to TSV |
| Color (+3) | Color Mixer, Color Shades, Color Tints |
| Security (+2) | JWT Encoder, Hash File |

**Result:** +19 tools

### Phase 23: Account Tools ✅

| Tool | Description |
|---|---|
| Username Generator | 5 styles (Gamer/Professional/Funny/Random/Cute), 50+ adjectives, 50+ nouns |
| Email Validator | Bulk validate, disposable detection (16 domains), role-based detection |
| Phone Validator | 10 countries (US/VN/UK/JP/KR/CN/DE/FR/AU/IN), E.164 format |
| Credit Card Validator | Luhn algorithm, 7 card types (Visa/MC/Amex/Discover/JCB/Diners/UnionPay) |
| IBAN Validator | Mod-97 checksum, 15 countries, bank code extraction |

**New category:** Account & Identity (`account`, `#0ea5e9`)

### Phase 24: Security Tools Expansion ✅

| Tool | Description |
|---|---|
| IP Address Lookup | Auto-detect via ipify.org, geolocation via ip-api.com |
| DNS Lookup | Google DNS-over-HTTPS API, 8 record types |
| SSL Checker | crt.sh API, certificate transparency logs |
| Password Breach Checker | HaveIBeenPwned k-anonymity API |
| CSP Evaluator | Parse headers, security score (0-100), best practices |

**Result:** 5 → 12 Security tools

### Phase 25: Game Tools ✅

| Tool | Description |
|---|---|
| Error Code Lookup | 50+ codes (Riot/Vanguard, Steam, PlayStation, Xbox, Epic, Windows) |
| DPI Calculator | 7 games, eDPI, cm/360°, 7 pro player presets |
| Sensitivity Converter | 12 games, conversion formulas, swap button |
| Crosshair Generator | Valorant/CS2/Overwatch 2, canvas preview, import codes |
| Game Timer | Pomodoro/Custom/Stopwatch/Session, Web Audio beep, notifications |

**New category:** Game Tools (`game`, `#f97316`)

### Phase 26: Utility Tools ✅

| Tool | Description |
|---|---|
| Link Shortener | Hash-based, QR code, bulk processing |
| Invoice Generator | Line items, tax/discount, 5 currencies, print, localStorage |
| Signature Generator | Canvas drawing (mouse+touch), download PNG/SVG |
| Favicon Generator | Text/emoji/image input, 6 sizes, HTML code |
| Notepad | Multiple notes, auto-save, export .txt/.md, search |

**New category:** Utility Tools (`utility`, `#78716c`)

### Phase 27: AI Assistant Enhancement ✅

| Feature | Description |
|---|---|
| Dynamic speech bubble | 6 random texts, 45s interval, 5s display, bubble-pop animation |
| Knowledge base | 204+ tools with keywords, descriptions, use cases |

### Phase 28: UI/UX Improvements ✅

| Feature | Description |
|---|---|
| Collection card design | Accent bar top, icon, badge, hover lift effect |
| Select dropdown fix | appearance: none, custom arrow, proper height |
| Google Search Console | Verification meta tag |
| Service Worker cache | Version bumped to v4 |

---

## Categories hiện tại (19 categories)

| # | Category | ID | Tools | Color |
|---|---|---|---|---|
| 1 | Image Tools | `image` | 23 | `#3b82f6` |
| 2 | Text Tools | `text` | 33 | `#22c55e` |
| 3 | Developer Tools | `developer` | 61 | `#a855f7` |
| 4 | PDF Tools | `pdf` | 5 | `#ef4444` |
| 5 | Math & Calculators | `math` | 6 | `#f59e0b` |
| 6 | Security Tools | `security` | 12 | `#06b6d4` |
| 7 | Color Tools | `color` | 10 | `#ec4899` |
| 8 | Date & Time Tools | `datetime` | 4 | `#14b8a6` |
| 9 | SEO & Marketing | `seo` | 3 | `#8b5cf6` |
| 10 | Data & Spreadsheet | `data` | 6 | `#10b981` |
| 11 | Fun & Utility | `fun` | 8 | `#f97316` |
| 12 | Education & Students | `education` | 7 | `#6366f1` |
| 13 | Finance & Money | `finance` | 7 | `#84cc16` |
| 14 | Health & Medical | `health` | 6 | `#f43f5e` |
| 15 | Video & Audio | `video` | 5 | `#d946ef` |
| 16 | AI Tools | `ai` | 15 | `#8b5cf6` |
| 17 | Account & Identity | `account` | 5 | `#0ea5e9` |
| 18 | Game Tools | `game` | 5 | `#f97316` |
| 19 | Utility Tools | `utility` | 5 | `#78716c` |

---

## Roadmap tương lai

### Phase 29: AI Tools Tier 2 ⭐ Ưu tiên cao

| Tool | Model | Size | Task |
|---|---|---|---|
| Zero-shot Classification | `Xenova/deberta-v3-xsmall-mnli` | ~200MB | zero-shot-classification |
| Text Generation | `Xenova/distilgpt2` | ~350MB | text-generation |
| Image Similarity (CLIP) | `Xenova/clip-vit-base-patch32` | ~150MB | zero-shot-image-classification |
| Text Emotion Detection | `Xenova/distilroberta-base-go-emotions` | ~300MB | text-classification |
| Depth Estimation | `Xenova/dpt-large` | ~350MB | image-to-image |
| Pose Estimation | `Xenova/movenet-thunder` | ~10MB | object-detection |

### Phase 30: Workflow Expansion

- Thêm 20 workflow tools (text, regex, math, data)
- File-based workflow nodes (file-input, file-output)
- Batch workflow processing

### Phase 31: Batch Processing Everywhere

- Batch cho Text tools
- Batch cho Developer tools
- Batch cho Converter tools
- Shared BatchProcessor component

### Phase 32: Content & SEO

- 20 SEO-optimized blog posts
- Category landing pages
- Comparison pages
- Schema markup enhancement

### Phase 33: Developer Ecosystem

- Embed widget
- Browser extension
- API endpoints (Cloudflare Workers)
- CLI tool

### Phase 34: Monetization

- Advertising (AdSense/Carbon Ads)
- Premium tier ($5/month)
- Donations (Buy Me A Coffee)

### Phase 35: Performance & Quality

- Lighthouse score: target 95+
- 300+ tests (E2E with Playwright)
- Error monitoring (Sentry)
- Internationalization (i18n) — Vietnamese + English

---

*Cập nhật: 2026-06-03*
