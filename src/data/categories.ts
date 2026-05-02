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
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
