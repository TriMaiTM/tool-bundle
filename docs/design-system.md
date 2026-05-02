# Design System

ToolBundle uses a dark canvas + electric yellow accent design system defined in `DESIGN.md`.

## Colors

### Brand

| Token | Hex | Use |
|---|---|---|
| `primary` | `#faff69` | CTAs, accent text, active states |
| `primary-active` | `#e6eb52` | Hover/press state |
| `primary-disabled` | `#3a3a1f` | Disabled buttons |

### Surface

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0a0a0a` | Page background |
| `surface-soft` | `#121212` | Section dividers, subtle bands |
| `surface-card` | `#1a1a1a` | Cards, inputs, tool containers |
| `surface-elevated` | `#242424` | Nested cards, stat boxes |

### Text

| Token | Hex | Use |
|---|---|---|
| `on-dark` | `#ffffff` | Headlines, primary text |
| `body` | `#cccccc` | Running text |
| `body-strong` | `#e6e6e6` | Emphasized text |
| `muted` | `#888888` | Labels, captions |
| `muted-soft` | `#5a5a5a` | Tertiary text |

### Semantic

| Token | Hex | Use |
|---|---|---|
| `accent-emerald` | `#22c55e` | Success, privacy badges |
| `accent-rose` | `#ef4444` | Errors, destructive actions |
| `accent-blue` | `#3b82f6` | Info states |
| `warning` | `#f59e0b` | Warnings |

## Typography

### Font Stack

- **Body**: Inter (400 body, 600 sub-title, 700 display)
- **Code**: JetBrains Mono, Fira Code

### Scale

| Class | Size | Weight | Use |
|---|---|---|---|
| `text-display-xl` | 72px | 700 | Hero headlines |
| `text-display-lg` | 56px | 700 | Section headlines |
| `text-display-md` | 40px | 700 | Page headlines |
| `text-display-sm` | 32px | 700 | Sub-headlines |
| `text-title-lg` | 24px | 600 | Section titles |
| `text-title-md` | 18px | 600 | Card titles |
| `text-title-sm` | 16px | 600 | Sub-titles |
| `text-body-md` | 16px | 400 | Body text |
| `text-body-sm` | 14px | 400 | Small body text |
| `text-caption` | 13px | 400 | Captions |
| `text-caption-uppercase` | 12px | 600 | Labels (uppercase) |
| `text-code` | 14px | mono | Code blocks |

## Spacing

| Token | Value | Use |
|---|---|---|
| `xxs` | 4px | Tight gaps |
| `xs` | 8px | Small gaps |
| `sm` | 12px | Default gaps |
| `md` | 16px | Card padding |
| `lg` | 24px | Section padding |
| `xl` | 32px | Large gaps |
| `xxl` | 48px | Section margins |
| `section` | 96px | Major section spacing |

## Border Radius

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Subtle rounding |
| `sm` | 6px | Small elements |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards |
| `pill` | 9999px | Badges, tags |

## Components

### Buttons

```html
<!-- Primary (yellow) -->
<button class="btn-primary">Click Me</button>

<!-- Secondary (dark outlined) -->
<button class="btn-secondary">Cancel</button>
```

### Inputs

```html
<input class="input" placeholder="Type here..." />
<textarea class="textarea" placeholder="Longer text..."></textarea>
```

### Cards

```html
<div class="card">
  <h3 class="text-title-sm text-on-dark">Card Title</h3>
  <p class="text-body-sm text-muted">Card content</p>
</div>
```

### Badges

```html
<span class="badge">Category</span>
<span class="badge-yellow">New</span>
```

### Drop Zone (for file uploads)

```tsx
import FileDropZone from "../ui/FileDropZone";

<FileDropZone
  accept="image/*"
  onFiles={(files) => console.log(files)}
  label="Drop files here or click to browse"
  sublabel="Supports PNG, JPG, WebP up to 50MB"
/>
```

### Code Block

```html
<pre class="code-block">
  {code}
</pre>
```

## Customization

All design tokens are defined as CSS custom properties in `src/styles/global.css` via Tailwind's `@theme` directive. To customize:

```css
@theme {
  --color-primary: #your-color;
  --color-canvas: #your-bg;
  /* ... */
}
```
