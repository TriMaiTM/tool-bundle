import { describe, it, expect } from "vitest";
import {
  detectDelimiter,
  parseCSV,
  arrayToCSV,
  formatCSV,
  validateCSV,
} from "../utils/csv";

// ============================================
// detectDelimiter
// ============================================
describe("detectDelimiter", () => {
  it("detects comma delimiter", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects semicolon delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
  });

  it("detects tab delimiter", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("detects pipe delimiter", () => {
    expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("defaults to comma for ambiguous input", () => {
    expect(detectDelimiter("hello world")).toBe(",");
  });
});

// ============================================
// parseCSV
// ============================================
describe("parseCSV", () => {
  it("parses simple CSV", () => {
    const result = parseCSV("a,b,c\n1,2,3");
    expect(result).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields", () => {
    const result = parseCSV('"hello, world",b,c');
    expect(result[0][0]).toBe("hello, world");
  });

  it("handles escaped quotes", () => {
    const result = parseCSV('"say ""hello""",b');
    expect(result[0][0]).toBe('say "hello"');
  });

  it("returns empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("handles single column", () => {
    const result = parseCSV("a\nb\nc");
    expect(result).toEqual([["a"], ["b"], ["c"]]);
  });

  it("handles semicolon delimiter", () => {
    const result = parseCSV("a;b\n1;2", ";");
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("skips empty lines", () => {
    const result = parseCSV("a,b\n\n1,2");
    expect(result).toHaveLength(2);
  });
});

// ============================================
// arrayToCSV
// ============================================
describe("arrayToCSV", () => {
  it("converts array of objects to CSV", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const result = arrayToCSV(data);
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("returns empty string for empty array", () => {
    expect(arrayToCSV([])).toBe("");
  });

  it("quotes fields with commas", () => {
    const data = [{ name: "Doe, John", age: 30 }];
    const result = arrayToCSV(data);
    expect(result).toBe('name,age\n"Doe, John",30');
  });

  it("escapes quotes in fields", () => {
    const data = [{ name: 'Say "hello"', age: 30 }];
    const result = arrayToCSV(data);
    expect(result).toBe('name,age\n"Say ""hello""",30');
  });

  it("handles custom delimiter", () => {
    const data = [{ a: 1, b: 2 }];
    const result = arrayToCSV(data, ";");
    expect(result).toBe("a;b\n1;2");
  });

  it("handles null/undefined values", () => {
    const data = [{ name: "Alice", age: undefined }];
    const result = arrayToCSV(data);
    expect(result).toBe("name,age\nAlice,");
  });
});

// ============================================
// formatCSV
// ============================================
describe("formatCSV", () => {
  it("formats CSV consistently", () => {
    const input = "a,b,c\n1,2,3";
    expect(formatCSV(input)).toBe("a,b,c\n1,2,3");
  });

  it("returns empty for empty input", () => {
    expect(formatCSV("")).toBe("");
  });
});

// ============================================
// validateCSV
// ============================================
describe("validateCSV", () => {
  it("validates consistent columns", () => {
    const result = validateCSV("a,b,c\n1,2,3");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects inconsistent columns", () => {
    const result = validateCSV("a,b,c\n1,2");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports error for empty input", () => {
    const result = validateCSV("");
    expect(result.valid).toBe(false);
  });
});
