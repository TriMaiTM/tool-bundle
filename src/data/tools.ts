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
    description: "Convert PNG images to JPG with quality control and batch support.",
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
    description: "Resize images by pixels, percentage, or social media presets.",
    category: "image",
    icon: "maximize-2",
    slug: "image-resizer",
    featured: true,
    tags: ["resize", "dimensions"],
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Compress images with quality control and before/after preview.",
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
    description: "Count words, characters, sentences, and paragraphs instantly.",
    category: "text",
    icon: "hash",
    slug: "word-counter",
    featured: true,
    tags: ["count", "words", "characters"],
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Convert text between uppercase, lowercase, title case, and more.",
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
    description: "Test regular expressions with live highlighting and match details.",
    category: "developer",
    icon: "regex",
    slug: "regex-tester",
    featured: true,
    tags: ["regex", "pattern", "test"],
  },
  {
    id: "lorem-generator",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text by paragraphs, sentences, or words.",
    category: "developer",
    icon: "text",
    slug: "lorem-generator",
    tags: ["lorem", "placeholder", "dummy"],
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
export function getToolBySlug(categoryId: string, slug: string): Tool | undefined {
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
      t.tags?.some((tag) => tag.includes(q))
  );
}
