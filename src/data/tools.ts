export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  slug: string;
  featured?: boolean;
  tags?: string[];
}

export const tools: Tool[] = [
  // ============================================
  // Image Tools
  // ============================================
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    description:
      "Convert PNG images to JPG with quality control and batch support.",
    category: "image",
    icon: "image",
    slug: "png-to-jpg",
    featured: true,
    tags: ["convert", "png", "jpg"],
  },
  {
    id: "jpg-to-png",
    name: "JPG to PNG",
    description: "Convert JPG images to lossless PNG format.",
    category: "image",
    icon: "image",
    slug: "jpg-to-png",
    tags: ["convert", "jpg", "png"],
  },
  {
    id: "jpg-to-webp",
    name: "JPG to WebP",
    description: "Convert JPG to WebP for smaller, higher-quality files.",
    category: "image",
    icon: "image",
    slug: "jpg-to-webp",
    featured: true,
    tags: ["convert", "jpg", "webp"],
  },
  {
    id: "png-to-webp",
    name: "PNG to WebP",
    description: "Convert PNG to WebP for dramatically smaller file sizes.",
    category: "image",
    icon: "image",
    slug: "png-to-webp",
    tags: ["convert", "png", "webp"],
  },
  {
    id: "webp-to-png",
    name: "WebP to PNG",
    description: "Convert WebP images to universally compatible PNG format.",
    category: "image",
    icon: "image",
    slug: "webp-to-png",
    tags: ["convert", "webp", "png"],
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description:
      "Resize images by pixels, percentage, or social media presets.",
    category: "image",
    icon: "maximize-2",
    slug: "image-resizer",
    featured: true,
    tags: ["resize", "dimensions"],
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description:
      "Compress images with quality control and before/after preview.",
    category: "image",
    icon: "minimize-2",
    slug: "image-compressor",
    featured: true,
    tags: ["compress", "optimize"],
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with aspect ratio presets and rotation.",
    category: "image",
    icon: "crop",
    slug: "image-cropper",
    tags: ["crop", "trim"],
  },

  // ============================================
  // Text Tools
  // ============================================
  {
    id: "word-counter",
    name: "Word Counter",
    description:
      "Count words, characters, sentences, and paragraphs instantly.",
    category: "text",
    icon: "hash",
    slug: "word-counter",
    featured: true,
    tags: ["count", "words", "characters"],
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description:
      "Convert text between uppercase, lowercase, title case, and more.",
    category: "text",
    icon: "case-upper",
    slug: "case-converter",
    featured: true,
    tags: ["case", "uppercase", "lowercase"],
  },
  {
    id: "slug-generator",
    name: "Slug Generator",
    description: "Generate clean URL slugs from any text with bulk mode.",
    category: "text",
    icon: "link",
    slug: "slug-generator",
    tags: ["slug", "url", "seo"],
  },
  {
    id: "text-reverser",
    name: "Text Reverser",
    description: "Reverse text, words, or character order instantly.",
    category: "text",
    icon: "arrow-left-right",
    slug: "text-reverser",
    tags: ["reverse", "flip"],
  },
  {
    id: "line-counter",
    name: "Line Counter",
    description: "Count lines, blank lines, and non-blank lines.",
    category: "text",
    icon: "align-left",
    slug: "line-counter",
    tags: ["count", "lines"],
  },

  // ============================================
  // Developer Tools
  // ============================================
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting.",
    category: "developer",
    icon: "braces",
    slug: "json-formatter",
    featured: true,
    tags: ["json", "format", "validate"],
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 for text and files.",
    category: "developer",
    icon: "binary",
    slug: "base64-encoder",
    featured: true,
    tags: ["base64", "encode", "decode"],
  },
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs and URI components.",
    category: "developer",
    icon: "globe",
    slug: "url-encoder",
    tags: ["url", "encode", "decode"],
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, SHA-512 hashes from text.",
    category: "developer",
    icon: "fingerprint",
    slug: "hash-generator",
    tags: ["hash", "md5", "sha"],
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description:
      "Test regular expressions with live highlighting and match details.",
    category: "developer",
    icon: "regex",
    slug: "regex-tester",
    featured: true,
    tags: ["regex", "pattern", "test"],
  },
  {
    id: "lorem-generator",
    name: "Lorem Ipsum Generator",
    description:
      "Generate placeholder text by paragraphs, sentences, or words.",
    category: "developer",
    icon: "text",
    slug: "lorem-generator",
    tags: ["lorem", "placeholder", "dummy"],
  },

  // ============================================
  // PDF Tools
  // ============================================
  {
    id: "pdf-merger",
    name: "PDF Merger",
    description: "Combine multiple PDFs into one — private and instant.",
    category: "pdf",
    icon: "file-text",
    slug: "pdf-merger",
    featured: true,
    tags: ["pdf", "merge", "combine"],
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    description: "Split PDFs by page range or extract specific pages.",
    category: "pdf",
    icon: "scissors",
    slug: "pdf-splitter",
    tags: ["pdf", "split", "pages"],
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    description: "Reduce PDF file size — no uploads, instant compression.",
    category: "pdf",
    icon: "minimize-2",
    slug: "pdf-compressor",
    tags: ["pdf", "compress", "optimize"],
  },
  {
    id: "pdf-rotator",
    name: "PDF Rotator",
    description: "Rotate PDF pages — 90°, 180°, 270° clockwise.",
    category: "pdf",
    icon: "rotate-cw",
    slug: "pdf-rotator",
    tags: ["pdf", "rotate", "pages"],
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract text from any PDF — search, copy, or download.",
    category: "pdf",
    icon: "file-type",
    slug: "pdf-to-text",
    tags: ["pdf", "text", "extract"],
  },

  // ============================================
  // Math Tools
  // ============================================
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages, tips, discounts, and tax instantly.",
    category: "math",
    icon: "percent",
    slug: "percentage-calculator",
    featured: true,
    tags: ["percentage", "tip", "discount"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description:
      "Convert units across 5 categories: length, weight, temperature, speed, data.",
    category: "math",
    icon: "arrow-left-right",
    slug: "unit-converter",
    featured: true,
    tags: ["convert", "units", "measurement"],
  },
  {
    id: "bmi-calculator",
    name: "BMI Calculator",
    description:
      "Calculate Body Mass Index with ideal weight and health insights.",
    category: "math",
    icon: "heart-pulse",
    slug: "bmi-calculator",
    tags: ["bmi", "health", "weight"],
  },
  {
    id: "loan-calculator",
    name: "Loan Calculator",
    description: "Calculate loan payments with amortization schedule.",
    category: "math",
    icon: "landmark",
    slug: "loan-calculator",
    tags: ["loan", "mortgage", "payment"],
  },
  {
    id: "age-calculator",
    name: "Age Calculator",
    description:
      "Calculate exact age with zodiac sign and next birthday countdown.",
    category: "math",
    icon: "cake",
    slug: "age-calculator",
    tags: ["age", "birthday", "zodiac"],
  },

  // ============================================
  // Security Tools
  // ============================================
  {
    id: "password-generator",
    name: "Password Generator",
    description:
      "Generate secure passwords with custom length and character sets.",
    category: "security",
    icon: "key-round",
    slug: "password-generator",
    featured: true,
    tags: ["password", "generate", "secure"],
  },
  {
    id: "password-strength-checker",
    name: "Password Strength Checker",
    description:
      "Test password strength with entropy and crack time estimates.",
    category: "security",
    icon: "shield-check",
    slug: "password-strength-checker",
    tags: ["password", "strength", "security"],
  },
  {
    id: "otp-generator",
    name: "OTP Generator",
    description:
      "Generate TOTP 2FA codes with countdown timer and auto-refresh.",
    category: "security",
    icon: "timer",
    slug: "otp-generator",
    tags: ["otp", "totp", "2fa", "authenticator"],
  },

  // ============================================
  // Text Tools (Extended)
  // ============================================
  {
    id: "text-repeater",
    name: "Text Repeater",
    description: "Repeat text N times with custom separator options.",
    category: "text",
    icon: "repeat",
    slug: "text-repeater",
    tags: ["repeat", "duplicate", "text"],
  },
  {
    id: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    description:
      "Remove duplicate lines from text — case-sensitive or insensitive.",
    category: "text",
    icon: "list-minus",
    slug: "remove-duplicate-lines",
    tags: ["duplicate", "lines", "dedupe"],
  },
  {
    id: "text-sorter",
    name: "Text Sorter",
    description: "Sort lines alphabetically, by length, or randomly.",
    category: "text",
    icon: "arrow-up-down",
    slug: "text-sorter",
    tags: ["sort", "alphabetical", "lines"],
  },
  {
    id: "reading-time-calculator",
    name: "Reading Time Calculator",
    description: "Estimate reading and speaking time with adjustable WPM.",
    category: "text",
    icon: "clock",
    slug: "reading-time-calculator",
    tags: ["reading", "time", "wpm"],
  },

  // ============================================
  // Developer Tools (Extended)
  // ============================================
  {
    id: "markdown-to-html",
    name: "Markdown to HTML",
    description: "Convert Markdown to HTML with live preview.",
    category: "developer",
    icon: "file-code",
    slug: "markdown-to-html",
    tags: ["markdown", "html", "convert"],
  },
  {
    id: "html-to-markdown",
    name: "HTML to Markdown",
    description: "Convert HTML to clean Markdown — all elements supported.",
    category: "developer",
    icon: "code",
    slug: "html-to-markdown",
    tags: ["html", "markdown", "convert"],
  },
  {
    id: "css-formatter",
    name: "CSS Formatter",
    description: "Format, beautify, and minify CSS with custom indentation.",
    category: "developer",
    icon: "paintbrush",
    slug: "css-formatter",
    tags: ["css", "format", "minify"],
  },
  {
    id: "yaml-formatter",
    name: "YAML Formatter",
    description: "Format, validate, and beautify YAML with error details.",
    category: "developer",
    icon: "file-cog",
    slug: "yaml-formatter",
    tags: ["yaml", "format", "validate"],
  },

  // ============================================
  // Color Tools
  // ============================================
  {
    id: "color-picker",
    name: "Color Picker",
    description:
      "Pick and convert colors between HEX, RGB, and HSL with live preview.",
    category: "color",
    icon: "pipette",
    slug: "color-picker",
    featured: true,
    tags: ["color", "hex", "rgb", "hsl"],
  },
  {
    id: "color-palette-generator",
    name: "Color Palette Generator",
    description: "Generate harmonious color palettes from any base color.",
    category: "color",
    icon: "palette",
    slug: "color-palette-generator",
    tags: ["color", "palette", "harmony"],
  },
  {
    id: "contrast-checker",
    name: "Contrast Checker WCAG",
    description: "Check WCAG color contrast — AA and AAA compliance.",
    category: "color",
    icon: "eye",
    slug: "contrast-checker",
    tags: ["contrast", "wcag", "accessibility"],
  },
  {
    id: "css-gradient-generator",
    name: "CSS Gradient Generator",
    description: "Create CSS gradients with live preview and presets.",
    category: "color",
    icon: "blend",
    slug: "css-gradient-generator",
    tags: ["gradient", "css", "linear", "radial"],
  },

  // ============================================
  // Date & Time Tools
  // ============================================
  {
    id: "countdown-timer",
    name: "Countdown Timer",
    description: "Countdown to any date with presets and alerts.",
    category: "datetime",
    icon: "timer",
    slug: "countdown-timer",
    featured: true,
    tags: ["countdown", "timer", "date"],
  },
  {
    id: "timezone-converter",
    name: "Timezone Converter",
    description: "Convert time between timezones with world clock.",
    category: "datetime",
    icon: "globe",
    slug: "timezone-converter",
    tags: ["timezone", "convert", "world"],
  },
  {
    id: "date-difference-calculator",
    name: "Date Difference Calculator",
    description: "Calculate the exact difference between two dates.",
    category: "datetime",
    icon: "calendar-days",
    slug: "date-difference-calculator",
    tags: ["date", "difference", "duration"],
  },
  {
    id: "unix-timestamp-converter",
    name: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to dates and back.",
    category: "datetime",
    icon: "clock",
    slug: "unix-timestamp-converter",
    tags: ["unix", "timestamp", "epoch"],
  },
];

/**
 * Get all tools for a specific category
 */
export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((t) => t.category === categoryId);
}

/**
 * Get a tool by its slug and category
 */
export function getToolBySlug(
  categoryId: string,
  slug: string,
): Tool | undefined {
  return tools.find((t) => t.category === categoryId && t.slug === slug);
}

/**
 * Get featured tools across all categories
 */
export function getFeaturedTools(): Tool[] {
  return tools.filter((t) => t.featured);
}

/**
 * Search tools by query
 */
export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.includes(q)),
  );
}
