/**
 * Text processing utility functions
 * Extracted from tool components for testability
 */

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersNoSpaces(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

export function countParagraphs(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

export function countLines(text: string): {
  total: number;
  blank: number;
  nonBlank: number;
} {
  if (!text) return { total: 0, blank: 0, nonBlank: 0 };
  const lines = text.split("\n");
  const blank = lines.filter((l) => l.trim().length === 0).length;
  return {
    total: lines.length,
    blank,
    nonBlank: lines.length - blank,
  };
}

export type CaseMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "alternating"
  | "inverse";

export function convertCase(text: string, mode: CaseMode): string {
  if (!text) return "";
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case "sentence":
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "camel":
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_: string, c: string) =>
          c.toUpperCase()
        );
    case "pascal": {
      const camel = text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_: string, c: string) =>
          c.toUpperCase()
        );
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    }
    case "snake":
      return text
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    case "kebab":
      return text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    case "alternating":
      return text
        .split("")
        .map((c, i) =>
          i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
        )
        .join("");
    case "inverse":
      return text
        .split("")
        .map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        )
        .join("");
    default:
      return text;
  }
}

export function generateSlug(
  text: string,
  separator = "-",
  lowercase = true
): string {
  if (!text.trim()) return "";
  let slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, separator);
  if (lowercase) slug = slug.toLowerCase();
  return slug;
}

export type ReverseMode = "characters" | "words" | "lines";

export function reverseText(text: string, mode: ReverseMode): string {
  if (!text) return "";
  switch (mode) {
    case "characters":
      return text.split("").reverse().join("");
    case "words":
      return text.split(/\s+/).reverse().join(" ");
    case "lines":
      return text.split("\n").reverse().join("\n");
    default:
      return text;
  }
}

export function repeatText(
  text: string,
  count: number,
  separator: string
): string {
  if (!text || count <= 0) return "";
  return Array.from({ length: count }, () => text).join(separator);
}

export interface RemoveDuplicateOptions {
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  keepEmptyLines?: boolean;
}

export function removeDuplicateLines(
  text: string,
  options: RemoveDuplicateOptions = {}
): string {
  if (!text) return "";
  const { caseSensitive = true, trimWhitespace = true, keepEmptyLines = true } =
    options;
  const lines = text.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = trimWhitespace ? line.trim() : line;
    const normalizedKey = caseSensitive ? key : key.toLowerCase();

    if (!keepEmptyLines && key.length === 0) continue;

    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push(line);
    }
  }
  return result.join("\n");
}

export type SortMode =
  | "alphabetical"
  | "reverse"
  | "shortest"
  | "longest"
  | "random";

export function sortLines(
  text: string,
  mode: SortMode,
  caseSensitive = true
): string {
  if (!text) return "";
  const lines = text.split("\n");
  const sorted = [...lines];

  switch (mode) {
    case "alphabetical":
      sorted.sort((a, b) =>
        caseSensitive
          ? a.localeCompare(b)
          : a.toLowerCase().localeCompare(b.toLowerCase())
      );
      break;
    case "reverse":
      sorted.sort((a, b) =>
        caseSensitive
          ? b.localeCompare(a)
          : b.toLowerCase().localeCompare(a.toLowerCase())
      );
      break;
    case "shortest":
      sorted.sort((a, b) => a.length - b.length);
      break;
    case "longest":
      sorted.sort((a, b) => b.length - a.length);
      break;
    case "random":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;
  }
  return sorted.join("\n");
}

export function calculateReadingTime(
  text: string,
  readingWpm = 200,
  speakingWpm = 150
): {
  words: number;
  sentences: number;
  readingMinutes: number;
  readingSeconds: number;
  speakingMinutes: number;
  speakingSeconds: number;
} {
  const words = countWords(text);
  const sentences = countSentences(text);
  const readingTotalSeconds = (words / readingWpm) * 60;
  const speakingTotalSeconds = (words / speakingWpm) * 60;

  return {
    words,
    sentences,
    readingMinutes: Math.floor(readingTotalSeconds / 60),
    readingSeconds: Math.round(readingTotalSeconds % 60),
    speakingMinutes: Math.floor(speakingTotalSeconds / 60),
    speakingSeconds: Math.round(speakingTotalSeconds % 60),
  };
}
