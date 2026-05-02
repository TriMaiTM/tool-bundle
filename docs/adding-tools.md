# Adding New Tools

This guide walks you through adding a new tool to ToolBundle.

## Overview

Adding a tool requires **3 files**:

1. **Tool registry entry** — `src/data/tools.ts` (metadata)
2. **Tool component** — `src/components/tools/YourTool.tsx` (UI + logic)
3. **ToolRenderer registration** — `src/components/tools/ToolRenderer.tsx` (routing)

Astro automatically generates the page at `/{category}/{slug}`.

## Step 1: Register the Tool

Open `src/data/tools.ts` and add an entry:

```typescript
{
  id: "my-new-tool",           // Unique identifier
  name: "My New Tool",         // Display name
  description: "Short description of what this tool does.",  // Shown on cards and SEO
  category: "text",            // Must match a category ID from categories.ts
  icon: "wand",                // Lucide icon name
  slug: "my-new-tool",         // URL path: /text/my-new-tool
  featured: true,              // (optional) Show on homepage featured section
  tags: ["tag1", "tag2"],      // (optional) For search functionality
}
```

### Available Categories

| ID | Name | Color |
|---|---|---|
| `image` | Image Tools | `#3b82f6` (blue) |
| `text` | Text Tools | `#22c55e` (green) |
| `developer` | Developer Tools | `#a855f7` (purple) |
| `pdf` | PDF Tools | `#ef4444` (red) |
| `math` | Math & Calculators | `#f59e0b` (amber) |
| `security` | Security Tools | `#06b6d4` (cyan) |

To add a new category, see [Project Structure](./project-structure.md#adding-a-new-category).

## Step 2: Create the Component

Create `src/components/tools/MyNewTool.tsx`:

```tsx
import { useState, useCallback, useMemo } from "preact/hooks";

export default function MyNewTool() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input) return "";
    // Your processing logic here
    return input.toUpperCase(); // Example
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  return (
    <div>
      {/* Controls */}
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <button class="btn-primary" onClick={() => {}}>
          Do Something
        </button>
      </div>

      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Input</label>
        <textarea
          class="textarea"
          placeholder="Enter your input..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {/* Output */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-caption-uppercase text-muted">Output</label>
          {result && (
            <button
              class="text-body-sm text-primary hover:text-primary-active transition-colors"
              onClick={handleCopy}
            >
              Copy
            </button>
          )}
        </div>
        <textarea
          class="textarea"
          value={result}
          readOnly
          placeholder="Result will appear here..."
        />
      </div>
    </div>
  );
}
```

### Component Guidelines

- Use `preact/hooks` (useState, useCallback, useMemo, useEffect, useRef)
- Use CSS classes from the design system: `btn-primary`, `btn-secondary`, `textarea`, `input`, `card`, `badge`
- Use `text-caption-uppercase text-muted` for labels
- Use `text-primary` for accent text (yellow)
- Processing should happen client-side (no fetch to external APIs)
- Support copy-to-clipboard for output
- Handle errors gracefully with error messages

### Available CSS Classes

| Class | Use |
|---|---|
| `btn-primary` | Yellow CTA button |
| `btn-secondary` | Dark outlined button |
| `textarea` | Multi-line input |
| `input` | Single-line input |
| `card` | Dark card container |
| `badge` | Pill badge |
| `badge-yellow` | Yellow pill badge |
| `drop-zone` | Drag-and-drop file area |
| `code-block` | Monospace code output |

### File Processing Tools

For tools that process files (images, PDFs), use the shared components:

```tsx
import FileDropZone from "../ui/FileDropZone";

// In your component:
<FileDropZone
  accept="image/*"           // MIME type filter
  multiple={false}           // Allow multiple files
  onFiles={(files) => {}}    // Callback with File[]
  label="Drop files here"    // Main text
  sublabel="Up to 50MB"      // Subtitle
/>
```

For image processing, use the shared utilities:

```tsx
import { loadImage, convertImage, resizeImage } from "../../utils/image";
import { downloadBlob, formatFileSize } from "../../utils/download";
```

For PDF processing:

```tsx
import { PDFDocument } from "pdf-lib";
```

## Step 3: Register in ToolRenderer

Open `src/components/tools/ToolRenderer.tsx`:

```tsx
// 1. Import your component
import MyNewTool from "./MyNewTool";

// 2. Add to the switch statement
case "my-new-tool":
  return <MyNewTool />;
```

## Step 4: Verify

```bash
npm run build
```

Your tool is now live at `http://localhost:4321/{category}/{slug}`.

## Example: Minimal Text Tool

Here's a complete example of a "Text Repeater" tool:

### tools.ts entry

```typescript
{
  id: "text-repeater",
  name: "Text Repeater",
  description: "Repeat any text N times with a custom separator.",
  category: "text",
  icon: "repeat",
  slug: "text-repeater",
}
```

### TextRepeater.tsx

```tsx
import { useState, useMemo } from "preact/hooks";

export default function TextRepeater() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [separator, setSeparator] = useState("\n");

  const result = useMemo(() => {
    if (!text) return "";
    return Array.from({ length: count }, () => text).join(separator);
  }, [text, count, separator]);

  return (
    <div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Repeat Count</label>
          <input
            type="number"
            class="input"
            min={1}
            max={1000}
            value={count}
            onInput={(e) => setCount(Number((e.target as HTMLInputElement).value) || 1)}
          />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Separator</label>
          <select
            class="input"
            value={separator}
            onChange={(e) => setSeparator((e.target as HTMLSelectElement).value)}
          >
            <option value="\n">New Line</option>
            <option value=" ">Space</option>
            <option value=",">Comma</option>
            <option value="">None</option>
          </select>
        </div>
      </div>

      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Input</label>
        <textarea
          class="textarea"
          placeholder="Enter text to repeat..."
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div>
        <label class="text-caption-uppercase text-muted block mb-2">Output</label>
        <textarea class="textarea" value={result} readOnly style="min-height: 200px" />
      </div>
    </div>
  );
}
```

### ToolRenderer.tsx addition

```tsx
import TextRepeater from "./TextRepeater";

// In switch:
case "text-repeater":
  return <TextRepeater />;
```

Done! The tool is now accessible at `/text/text-repeater`.
