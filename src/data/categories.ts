export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // accent color for category
  toolCount: number;
}

export const categories: Category[] = [
  {
    id: "image",
    name: "Image Tools",
    description:
      "Convert, resize, compress, and edit images — 100% in your browser.",
    icon: "image",
    color: "#3b82f6",
    toolCount: 0,
  },
  {
    id: "text",
    name: "Text Tools",
    description:
      "Count words, convert cases, generate slugs, and transform text instantly.",
    icon: "type",
    color: "#22c55e",
    toolCount: 0,
  },
  {
    id: "developer",
    name: "Developer Tools",
    description:
      "Format JSON, encode Base64, test regex, and more dev utilities.",
    icon: "code",
    color: "#a855f7",
    toolCount: 0,
  },
  {
    id: "pdf",
    name: "PDF Tools",
    description:
      "Merge, split, compress, and edit PDF files privately in your browser.",
    icon: "file-text",
    color: "#ef4444",
    toolCount: 0,
  },
  {
    id: "math",
    name: "Math & Calculators",
    description: "Calculators, converters, and math solvers for everyday use.",
    icon: "calculator",
    color: "#f59e0b",
    toolCount: 0,
  },
  {
    id: "security",
    name: "Security Tools",
    description:
      "Generate passwords, QR codes, hashes, and encrypt data securely.",
    icon: "shield",
    color: "#06b6d4",
    toolCount: 0,
  },
  {
    id: "color",
    name: "Color Tools",
    description:
      "Pick, convert, generate, and test colors for design and development.",
    icon: "palette",
    color: "#ec4899",
    toolCount: 0,
  },
  {
    id: "datetime",
    name: "Date & Time Tools",
    description:
      "Countdown timers, timezone converters, date calculators, and more.",
    icon: "calendar",
    color: "#14b8a6",
    toolCount: 0,
  },
  {
    id: "seo",
    name: "SEO & Marketing",
    description:
      "Generate meta tags, robots.txt, sitemaps, and optimize for search engines.",
    icon: "search",
    color: "#8b5cf6",
    toolCount: 0,
  },
  {
    id: "data",
    name: "Data & Spreadsheet",
    description: "Convert between CSV, JSON, and other data formats instantly.",
    icon: "table",
    color: "#10b981",
    toolCount: 0,
  },
  {
    id: "fun",
    name: "Fun & Utility",
    description:
      "Random generators, dice rollers, wheel spinners, and fun tools.",
    icon: "sparkles",
    color: "#f97316",
    toolCount: 0,
  },
  {
    id: "education",
    name: "Education & Students",
    description:
      "Flashcards, quizzes, grade calculators, citation generators, and study tools.",
    icon: "graduation-cap",
    color: "#6366f1",
    toolCount: 0,
  },
  {
    id: "finance",
    name: "Finance & Money",
    description:
      "Currency converters, loan calculators, budget trackers, and investment tools.",
    icon: "wallet",
    color: "#84cc16",
    toolCount: 0,
  },
  {
    id: "health",
    name: "Health & Medical",
    description:
      "BMI, calorie, sleep cycle, body fat calculators and health tools.",
    icon: "heart-pulse",
    color: "#f43f5e",
    toolCount: 0,
  },
  {
    id: "video",
    name: "Video & Audio",
    description:
      "Convert, trim, compress video and audio files in your browser.",
    icon: "film",
    color: "#d946ef",
    toolCount: 0,
  },
  {
    id: "ai",
    name: "AI Tools",
    description:
      "AI-powered tools running 100% in your browser — private, fast, free.",
    icon: "brain",
    color: "#8b5cf6",
    toolCount: 0,
  },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
