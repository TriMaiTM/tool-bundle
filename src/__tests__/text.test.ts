import { describe, expect, it } from "vitest";
import {
	calculateReadingTime,
	convertCase,
	countCharacters,
	countCharactersNoSpaces,
	countLines,
	countParagraphs,
	countSentences,
	countWords,
	generateSlug,
	removeDuplicateLines,
	repeatText,
	reverseText,
	sortLines,
} from "../utils/text";

// ============================================
// countWords
// ============================================
describe("countWords", () => {
	it("counts words in a simple string", () => {
		expect(countWords("hello world")).toBe(2);
	});

	it("returns 0 for empty string", () => {
		expect(countWords("")).toBe(0);
	});

	it("returns 0 for whitespace-only", () => {
		expect(countWords("   ")).toBe(0);
	});

	it("handles multiple spaces between words", () => {
		expect(countWords("hello   world   foo")).toBe(3);
	});

	it("handles leading/trailing whitespace", () => {
		expect(countWords("  hello world  ")).toBe(2);
	});

	it("counts single word", () => {
		expect(countWords("hello")).toBe(1);
	});
});

// ============================================
// countCharacters
// ============================================
describe("countCharacters", () => {
	it("counts characters including spaces", () => {
		expect(countCharacters("hello world")).toBe(11);
	});

	it("returns 0 for empty string", () => {
		expect(countCharacters("")).toBe(0);
	});

	it("counts spaces", () => {
		expect(countCharacters("   ")).toBe(3);
	});
});

// ============================================
// countCharactersNoSpaces
// ============================================
describe("countCharactersNoSpaces", () => {
	it("counts characters excluding spaces", () => {
		expect(countCharactersNoSpaces("hello world")).toBe(10);
	});

	it("returns 0 for empty string", () => {
		expect(countCharactersNoSpaces("")).toBe(0);
	});

	it("returns 0 for whitespace-only", () => {
		expect(countCharactersNoSpaces("   ")).toBe(0);
	});
});

// ============================================
// countSentences
// ============================================
describe("countSentences", () => {
	it("counts sentences separated by periods", () => {
		expect(countSentences("Hello. World. Foo.")).toBe(3);
	});

	it("counts sentences with mixed punctuation", () => {
		expect(countSentences("Hello! How are you? I'm fine.")).toBe(3);
	});

	it("returns 0 for empty string", () => {
		expect(countSentences("")).toBe(0);
	});

	it("counts single sentence", () => {
		expect(countSentences("Hello world.")).toBe(1);
	});
});

// ============================================
// countParagraphs
// ============================================
describe("countParagraphs", () => {
	it("counts paragraphs separated by blank lines", () => {
		expect(countParagraphs("Para 1\n\nPara 2\n\nPara 3")).toBe(3);
	});

	it("returns 1 for single paragraph", () => {
		expect(countParagraphs("Just one paragraph.")).toBe(1);
	});

	it("returns 0 for empty string", () => {
		expect(countParagraphs("")).toBe(0);
	});
});

// ============================================
// countLines
// ============================================
describe("countLines", () => {
	it("counts total, blank, and non-blank lines", () => {
		const result = countLines("line 1\n\nline 3\n\nline 5");
		expect(result.total).toBe(5);
		expect(result.blank).toBe(2);
		expect(result.nonBlank).toBe(3);
	});

	it("handles single line", () => {
		const result = countLines("hello");
		expect(result.total).toBe(1);
		expect(result.blank).toBe(0);
		expect(result.nonBlank).toBe(1);
	});

	it("returns zeros for empty string", () => {
		const result = countLines("");
		expect(result.total).toBe(0);
		expect(result.blank).toBe(0);
		expect(result.nonBlank).toBe(0);
	});
});

// ============================================
// convertCase
// ============================================
describe("convertCase", () => {
	it("converts to UPPER CASE", () => {
		expect(convertCase("hello world", "upper")).toBe("HELLO WORLD");
	});

	it("converts to lower case", () => {
		expect(convertCase("HELLO WORLD", "lower")).toBe("hello world");
	});

	it("converts to Title Case", () => {
		expect(convertCase("hello world", "title")).toBe("Hello World");
	});

	it("converts to Sentence case", () => {
		expect(convertCase("hello world", "sentence")).toBe("Hello world");
	});

	it("converts to camelCase", () => {
		expect(convertCase("hello world", "camel")).toBe("helloWorld");
	});

	it("converts to PascalCase", () => {
		expect(convertCase("hello world", "pascal")).toBe("HelloWorld");
	});

	it("converts to snake_case", () => {
		expect(convertCase("hello world", "snake")).toBe("hello_world");
	});

	it("converts to kebab-case", () => {
		expect(convertCase("hello world", "kebab")).toBe("hello-world");
	});

	it("returns empty string for empty input", () => {
		expect(convertCase("", "upper")).toBe("");
	});
});

// ============================================
// generateSlug
// ============================================
describe("generateSlug", () => {
	it("generates slug from simple text", () => {
		expect(generateSlug("Hello World")).toBe("hello-world");
	});

	it("removes special characters", () => {
		expect(generateSlug("Hello, World!")).toBe("hello-world");
	});

	it("handles multiple spaces", () => {
		expect(generateSlug("Hello   World")).toBe("hello-world");
	});

	it("supports custom separator", () => {
		expect(generateSlug("Hello World", "_")).toBe("hello_world");
	});

	it("preserves case when lowercase is false", () => {
		expect(generateSlug("Hello World", "-", false)).toBe("Hello-World");
	});

	it("returns empty string for empty input", () => {
		expect(generateSlug("")).toBe("");
	});
});

// ============================================
// reverseText
// ============================================
describe("reverseText", () => {
	it("reverses characters", () => {
		expect(reverseText("hello", "characters")).toBe("olleh");
	});

	it("reverses words", () => {
		expect(reverseText("hello world foo", "words")).toBe("foo world hello");
	});

	it("reverses lines", () => {
		expect(reverseText("a\nb\nc", "lines")).toBe("c\nb\na");
	});

	it("returns empty string for empty input", () => {
		expect(reverseText("", "characters")).toBe("");
	});
});

// ============================================
// repeatText
// ============================================
describe("repeatText", () => {
	it("repeats text with separator", () => {
		expect(repeatText("hello", 3, ", ")).toBe("hello, hello, hello");
	});

	it("repeats with newline separator", () => {
		expect(repeatText("a", 3, "\n")).toBe("a\na\na");
	});

	it("returns empty for 0 count", () => {
		expect(repeatText("hello", 0, ", ")).toBe("");
	});

	it("returns empty for empty text", () => {
		expect(repeatText("", 3, ", ")).toBe("");
	});
});

// ============================================
// removeDuplicateLines
// ============================================
describe("removeDuplicateLines", () => {
	it("removes duplicate lines", () => {
		expect(removeDuplicateLines("a\nb\na\nc")).toBe("a\nb\nc");
	});

	it("keeps all unique lines", () => {
		expect(removeDuplicateLines("a\nb\nc")).toBe("a\nb\nc");
	});

	it("handles case-insensitive dedup", () => {
		expect(removeDuplicateLines("A\na\nB", { caseSensitive: false })).toBe("A\nB");
	});

	it("returns empty for empty input", () => {
		expect(removeDuplicateLines("")).toBe("");
	});
});

// ============================================
// sortLines
// ============================================
describe("sortLines", () => {
	it("sorts alphabetically", () => {
		expect(sortLines("c\na\nb", "alphabetical")).toBe("a\nb\nc");
	});

	it("sorts reverse alphabetically", () => {
		expect(sortLines("a\nb\nc", "reverse")).toBe("c\nb\na");
	});

	it("sorts by shortest first", () => {
		expect(sortLines("aaa\na\naa", "shortest")).toBe("a\naa\naaa");
	});

	it("sorts by longest first", () => {
		expect(sortLines("a\naa\naaa", "longest")).toBe("aaa\naa\na");
	});

	it("returns empty for empty input", () => {
		expect(sortLines("", "alphabetical")).toBe("");
	});
});

// ============================================
// calculateReadingTime
// ============================================
describe("calculateReadingTime", () => {
	it("calculates reading time for 200 words", () => {
		const text = Array(200).fill("word").join(" ");
		const result = calculateReadingTime(text);
		expect(result.words).toBe(200);
		expect(result.readingMinutes).toBe(1);
		expect(result.readingSeconds).toBe(0);
	});

	it("calculates for empty text", () => {
		const result = calculateReadingTime("");
		expect(result.words).toBe(0);
		expect(result.readingMinutes).toBe(0);
	});

	it("uses custom WPM", () => {
		const text = Array(100).fill("word").join(" ");
		const result = calculateReadingTime(text, 100);
		expect(result.readingMinutes).toBe(1);
	});
});
