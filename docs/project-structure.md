# Project Structure

## Root Directory

```
ToolBundle/
├── .vscode/              # VS Code workspace settings
├── docs/                 # Project documentation
├── public/               # Static assets (copied as-is to dist/)
│   ├── icons/            # PWA icons
│   └── favicon.svg       # Favicon
├── src/                  # Source code
├── .gitignore
├── .npmrc
├── DESIGN.md             # Design system specification
├── LICENSE               # MIT License
├── README.md             # Project README
├── astro.config.mjs      # Astro configuration
├── package.json
└── tsconfig.json
```

## Source Directory (`src/`)

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.astro        # Site header with nav
│   │   └── Footer.astro        # Site footer with links
│   ├── tools/
│   │   ├── ToolRenderer.tsx    # Maps toolId → Preact component
│   │   ├── WordCounter.tsx     # Text tool
│   │   ├── CaseConverter.tsx   # Text tool
│   │   ├── JsonFormatter.tsx   # Developer tool
│   │   ├── ImageConverter.tsx  # Image tool (reused for format conversions)
│   │   ├── ImageResizer.tsx    # Image tool
│   │   ├── ImageCompressor.tsx # Image tool
│   │   ├── ImageCropper.tsx    # Image tool
│   │   └── ...                 # More tool components
│   └── ui/
│       ├── FileDropZone.tsx    # Reusable drag-and-drop file input
│       └── ToolCard.astro      # Card component for tool listings
├── data/
│   ├── categories.ts           # Category definitions (id, name, icon, color)
│   └── tools.ts                # Tool registry (id, name, description, category, slug)
├── layouts/
│   ├── Base.astro              # Root HTML layout (head, header, main, footer)
│   └── ToolLayout.astro        # Tool page layout (breadcrumb, title, privacy badge)
├── pages/
│   ├── index.astro             # Homepage (hero, featured tools, categories)
│   ├── [category]/
│   │   ├── index.astro         # Category listing page
│   │   └── [tool].astro        # Individual tool page (dynamic route)
│   └── tools/
│       └── index.astro         # All tools listing (optional)
├── styles/
│   └── global.css              # Design system tokens + component styles
└── utils/
    ├── ai.ts                   # AI utilities (encodeWAV, downloadBlob, resizeImage)
    ├── download.ts             # File download helpers (blob, text, clipboard)
    ├── image.ts                # Image processing (convert, resize, compress, crop)
    ├── favorites.ts            # Favorites & history (localStorage)
    ├── text.ts                 # Text processing utilities
    ├── math.ts                 # Math calculation utilities
    ├── color.ts                # Color conversion utilities
    ├── csv.ts                  # CSV parsing utilities
    └── security.ts             # Security utilities (password, OTP)
```

## Data Flow

```
User visits /image/png-to-jpg
         ↓
Astro static routing
  → src/pages/[category]/[tool].astro
  → getStaticPaths() generates all tool routes at build time
         ↓
ToolLayout renders
  → breadcrumb, title, description, privacy badge
         ↓
ToolRenderer receives toolId="png-to-jpg"
  → looks up component mapping
  → renders <ImageConverter fromFormat="PNG" toFormat="JPG" ... />
         ↓
Preact island hydrates on client
  → user interacts with tool
  → processing happens 100% in browser
```

## Adding a New Category

1. Add category entry to `src/data/categories.ts`:

```typescript
{
  id: "new-category",
  name: "New Category",
  description: "Description of the category.",
  icon: "icon-name",
  color: "#hexcolor",
  toolCount: 0,
}
```

2. Create the page directory: `src/pages/new-category/`

Astro automatically generates the category page via `[category]/index.astro`.

## Adding a New Tool

See [Adding New Tools](./adding-tools.md) for the full guide.
