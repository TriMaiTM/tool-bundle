# ToolBundle

> Every tool you need. Zero uploads. 100% client-side.

A collection of free, privacy-first browser tools for images, text, developer utilities and more. Every tool runs entirely in your browser — no file uploads, no accounts, no limits.

## Features

- **100% Client-Side** — Your files never leave your browser. All processing happens locally using JavaScript and Canvas API.
- **Privacy First** — No server uploads, no data collection, no cookies. What you process stays on your device.
- **Instant Results** — No upload waits, no queues. Results appear instantly because everything runs on your machine.
- **Free Forever** — No accounts, no subscriptions, no paywalls. Every tool is free for everyone.
- **21 Tools** — Across 3 categories (and growing): Image, Text, and Developer tools.
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

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/toolbundle.git
cd toolbundle

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/           # Header, Footer
│   ├── tools/            # Interactive tool components (Preact)
│   └── ui/               # Reusable UI components
├── data/
│   ├── categories.ts     # Category definitions
│   └── tools.ts          # Tool registry (metadata)
├── layouts/
│   ├── Base.astro        # Root layout
│   └── ToolLayout.astro  # Tool page layout
├── pages/
│   ├── index.astro       # Homepage
│   ├── [category]/
│   │   ├── index.astro   # Category listing
│   │   └── [tool].astro  # Dynamic tool page
├── styles/
│   └── global.css        # Design system tokens
└── utils/
    ├── download.ts       # File download helpers
    └── image.ts          # Image processing utilities
```

## Available Tools

### Image Tools (8)

| Tool | Description |
|---|---|
| PNG to JPG | Convert PNG images to JPG with quality control |
| JPG to PNG | Convert JPG images to lossless PNG format |
| JPG to WebP | Convert JPG to WebP for smaller files |
| PNG to WebP | Convert PNG to WebP for smaller files |
| WebP to PNG | Convert WebP to universally compatible PNG |
| Image Resizer | Resize by pixels, percentage, or social presets |
| Image Compressor | Compress with quality control and before/after preview |
| Image Cropper | Crop with aspect ratio presets |

### Text Tools (5)

| Tool | Description |
|---|---|
| Word Counter | Count words, characters, sentences, paragraphs |
| Case Converter | 10 case modes: UPPER, lower, camelCase, snake_case... |
| Slug Generator | Generate clean URL slugs with separator options |
| Text Reverser | Reverse characters, words, or lines |
| Line Counter | Count total, blank, and non-blank lines |

### Developer Tools (6)

| Tool | Description |
|---|---|
| JSON Formatter | Format, validate, and minify JSON |
| Base64 Encoder/Decoder | Encode and decode Base64 strings |
| URL Encoder/Decoder | Encode and decode URLs and URI components |
| Hash Generator | Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes |
| Regex Tester | Test regex with live highlighting and match details |
| Lorem Ipsum Generator | Generate placeholder text by paragraph, sentence, or word |

## Adding a New Tool

### 1. Register the tool

Add an entry to `src/data/tools.ts`:

```typescript
{
  id: "my-new-tool",
  name: "My New Tool",
  description: "What this tool does.",
  category: "text",        // Must match a category ID
  icon: "wand",
  slug: "my-new-tool",     // URL path: /text/my-new-tool
}
```

### 2. Create the component

Create `src/components/tools/MyNewTool.tsx`:

```tsx
import { useState } from "preact/hooks";

export default function MyNewTool() {
  const [input, setInput] = useState("");

  return (
    <div>
      <textarea
        class="textarea"
        placeholder="Enter input..."
        value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
      />
      {/* Your tool UI here */}
    </div>
  );
}
```

### 3. Register in ToolRenderer

Add the component to `src/components/tools/ToolRenderer.tsx`:

```tsx
import MyNewTool from "./MyNewTool";

// In the switch statement:
case "my-new-tool":
  return <MyNewTool />;
```

That's it. Astro will automatically generate the page at `/{category}/my-new-tool`.

## Design System

The UI follows a dark canvas + electric yellow accent design system defined in `DESIGN.md`:

- **Canvas**: `#0a0a0a` (near-pure black)
- **Primary**: `#faff69` (electric yellow)
- **Font**: Inter (400 body, 600 sub-title, 700 display)
- **Code**: JetBrains Mono
- **Cards**: `#1a1a1a` with `#2a2a2a` borders

All design tokens are available as CSS custom properties via `src/styles/global.css`.

## License

MIT

---

Built with Astro + Preact + Tailwind CSS
