/**
 * CSV parsing and conversion utility functions
 * Extracted from tool components for testability
 */

export function detectDelimiter(text: string): string {
  const lines = text.split("\n").slice(0, 5);
  const delimiters = [",", ";", "\t", "|"];
  let bestDelimiter = ",";
  let bestScore = 0;

  for (const d of delimiters) {
    const counts = lines.map((l) => {
      const matches = l.match(new RegExp(d === "|" ? "\\|" : d === "\t" ? "\t" : d, "g"));
      return matches ? matches.length : 0;
    });
    const score = counts.reduce((a, b) => a + b, 0);
    const consistent = counts.every((c) => c === counts[0]);
    if (score > bestScore && consistent && score > 0) {
      bestScore = score;
      bestDelimiter = d;
    }
  }
  return bestDelimiter;
}

export function parseCSV(
  text: string,
  delimiter = ","
): string[][] {
  if (!text.trim()) return [];
  const lines = text.split("\n");
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current);
    result.push(row);
  }
  return result;
}

export function arrayToCSV(
  data: Record<string, unknown>[],
  delimiter = ","
): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = [headers.join(delimiter)];

  for (const item of data) {
    const row = headers.map((h) => {
      const val = String(item[h] ?? "");
      return val.includes(delimiter) || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    });
    rows.push(row.join(delimiter));
  }
  return rows.join("\n");
}

export function formatCSV(
  text: string,
  delimiter = ","
): string {
  const rows = parseCSV(text, delimiter);
  return rows.map((row) => row.join(delimiter)).join("\n");
}

export function validateCSV(
  text: string,
  delimiter = ","
): { valid: boolean; errors: string[] } {
  if (!text.trim()) return { valid: false, errors: ["Empty input"] };
  const rows = parseCSV(text, delimiter);
  if (rows.length === 0) return { valid: false, errors: ["No data found"] };

  const expectedCols = rows[0].length;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== expectedCols) {
      errors.push(
        `Line ${i + 1}: expected ${expectedCols} columns, found ${rows[i].length}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
