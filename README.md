# ToolBundle

> Every tool you need. Zero uploads. 100% client-side.

A collection of free, privacy-first browser tools for images, text, PDFs, math, developer utilities, and security. Every tool runs entirely in your browser — no file uploads, no accounts, no limits.

## Features

- **100% Client-Side** — Your files never leave your browser. All processing happens locally using JavaScript and Canvas API.
- **Privacy First** — No server uploads, no data collection, no cookies. What you process stays on your device.
- **Instant Results** — No upload waits, no queues. Results appear instantly because everything runs on your machine.
- **Free Forever** — No accounts, no subscriptions, no paywalls. Every tool is free for everyone.
- **32 Tools** — Across 6 categories: Image, Text, Developer, PDF, Math, and Security.
- **Dark UI** — Clean dark canvas with electric yellow accent. Built with a consistent design system.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build/) |
| UI Components | [Preact](https://preactjs.com/) (~3KB) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Language | TypeScript |
| Hosting | Static (Cloudflare Pages / Vercel / Netlify) |

## Getting Started

```bash
git clone https://github.com/your-username/toolbundle.git
cd toolbundle
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Documentation

Full documentation is available in the [`docs/`](./docs/) directory:

| Document | Description |
|---|---|
| [Getting Started](./docs/getting-started.md) | Installation, development, and deployment |
| [Tech Stack](./docs/tech-stack.md) | Technologies and architecture decisions |
| [Project Structure](./docs/project-structure.md) | Directory layout and file organization |
| [Adding New Tools](./docs/adding-tools.md) | Step-by-step guide to add a new tool |
| [Tools List](./docs/tools-list.md) | Complete list of all 32 tools |
| [Design System](./docs/design-system.md) | UI components, colors, typography |

## Available Tools

### Image Tools (8)
PNG to JPG, JPG to PNG, JPG to WebP, PNG to WebP, WebP to PNG, Image Resizer, Image Compressor, Image Cropper

### Text Tools (5)
Word Counter, Case Converter, Slug Generator, Text Reverser, Line Counter

### Developer Tools (6)
JSON Formatter, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Regex Tester, Lorem Ipsum Generator

### PDF Tools (5)
PDF Merger, PDF Splitter, PDF Compressor, PDF Rotator, PDF to Text

### Math & Calculators (5)
Percentage Calculator, Unit Converter, BMI Calculator, Loan Calculator, Age Calculator

### Security Tools (3)
Password Generator, Password Strength Checker, OTP Generator

## License

MIT

---

Built with Astro + Preact + Tailwind CSS
