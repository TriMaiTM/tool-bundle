import { describe, expect, it } from "vitest";
import {
	calculateContrastRatio,
	generatePalette,
	hexToHsl,
	hexToRgb,
	hslToHex,
	hslToRgb,
	rgbToHex,
	rgbToHsl,
} from "../utils/color";

// ============================================
// hexToRgb
// ============================================
describe("hexToRgb", () => {
	it("converts #ff0000 to RGB", () => {
		expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("converts #00ff00 to RGB", () => {
		expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
	});

	it("converts #0000ff to RGB", () => {
		expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
	});

	it("converts without # prefix", () => {
		expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("handles lowercase", () => {
		expect(hexToRgb("#faff69")).toEqual({ r: 250, g: 255, b: 105 });
	});

	it("returns null for invalid hex", () => {
		expect(hexToRgb("invalid")).toBeNull();
	});

	it("converts #000000 (black)", () => {
		expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("converts #ffffff (white)", () => {
		expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
	});
});

// ============================================
// rgbToHex
// ============================================
describe("rgbToHex", () => {
	it("converts red to hex", () => {
		expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
	});

	it("converts green to hex", () => {
		expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
	});

	it("converts blue to hex", () => {
		expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
	});

	it("converts black to hex", () => {
		expect(rgbToHex(0, 0, 0)).toBe("#000000");
	});

	it("converts white to hex", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
	});

	it("clamps values to 0-255", () => {
		expect(rgbToHex(300, -10, 128)).toBe("#ff0080");
	});
});

// ============================================
// rgbToHsl
// ============================================
describe("rgbToHsl", () => {
	it("converts pure red", () => {
		const result = rgbToHsl(255, 0, 0);
		expect(result.h).toBe(0);
		expect(result.s).toBe(100);
		expect(result.l).toBe(50);
	});

	it("converts pure green", () => {
		const result = rgbToHsl(0, 255, 0);
		expect(result.h).toBe(120);
		expect(result.s).toBe(100);
		expect(result.l).toBe(50);
	});

	it("converts pure blue", () => {
		const result = rgbToHsl(0, 0, 255);
		expect(result.h).toBe(240);
		expect(result.s).toBe(100);
		expect(result.l).toBe(50);
	});

	it("converts black", () => {
		const result = rgbToHsl(0, 0, 0);
		expect(result.h).toBe(0);
		expect(result.s).toBe(0);
		expect(result.l).toBe(0);
	});

	it("converts white", () => {
		const result = rgbToHsl(255, 255, 255);
		expect(result.s).toBe(0);
		expect(result.l).toBe(100);
	});

	it("converts gray", () => {
		const result = rgbToHsl(128, 128, 128);
		expect(result.s).toBe(0);
		expect(result.l).toBeCloseTo(50, 0);
	});
});

// ============================================
// hslToRgb
// ============================================
describe("hslToRgb", () => {
	it("converts pure red HSL", () => {
		const result = hslToRgb(0, 100, 50);
		expect(result.r).toBe(255);
		expect(result.g).toBe(0);
		expect(result.b).toBe(0);
	});

	it("converts pure green HSL", () => {
		const result = hslToRgb(120, 100, 50);
		expect(result.r).toBe(0);
		expect(result.g).toBe(255);
		expect(result.b).toBe(0);
	});

	it("converts black HSL", () => {
		const result = hslToRgb(0, 0, 0);
		expect(result.r).toBe(0);
		expect(result.g).toBe(0);
		expect(result.b).toBe(0);
	});

	it("converts white HSL", () => {
		const result = hslToRgb(0, 0, 100);
		expect(result.r).toBe(255);
		expect(result.g).toBe(255);
		expect(result.b).toBe(255);
	});
});

// ============================================
// hexToHsl
// ============================================
describe("hexToHsl", () => {
	it("converts red hex to HSL", () => {
		const result = hexToHsl("#ff0000");
		expect(result).not.toBeNull();
		expect(result?.h).toBe(0);
		expect(result?.s).toBe(100);
		expect(result?.l).toBe(50);
	});

	it("returns null for invalid hex", () => {
		expect(hexToHsl("invalid")).toBeNull();
	});
});

// ============================================
// hslToHex
// ============================================
describe("hslToHex", () => {
	it("converts red HSL to hex", () => {
		expect(hslToHex(0, 100, 50)).toBe("#ff0000");
	});

	it("converts black HSL to hex", () => {
		expect(hslToHex(0, 0, 0)).toBe("#000000");
	});
});

// ============================================
// Roundtrip conversions
// ============================================
describe("roundtrip conversions", () => {
	it("hex -> rgb -> hex", () => {
		const hex = "#3b82f6";
		const rgb = hexToRgb(hex)!;
		expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe(hex);
	});

	it("rgb -> hsl -> rgb (close enough)", () => {
		const r = 100;
		const g = 150;
		const b = 200;
		const hsl = rgbToHsl(r, g, b);
		const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
		// Allow ±1 due to rounding
		expect(Math.abs(rgb.r - r)).toBeLessThanOrEqual(1);
		expect(Math.abs(rgb.g - g)).toBeLessThanOrEqual(1);
		expect(Math.abs(rgb.b - b)).toBeLessThanOrEqual(1);
	});
});

// ============================================
// Contrast ratio
// ============================================
describe("calculateContrastRatio", () => {
	it("calculates maximum contrast (white on black)", () => {
		const ratio = calculateContrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
		expect(ratio).toBeCloseTo(21, 0);
	});

	it("calculates 1:1 for same color", () => {
		const ratio = calculateContrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 });
		expect(ratio).toBeCloseTo(1, 1);
	});

	it("calculates black on white (same as white on black)", () => {
		const ratio = calculateContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
		expect(ratio).toBeCloseTo(21, 0);
	});
});

// ============================================
// Palette generation
// ============================================
describe("generatePalette", () => {
	it("generates complementary palette (2 colors)", () => {
		const palette = generatePalette("#ff0000", "complementary");
		expect(palette).toHaveLength(2);
	});

	it("generates triadic palette (3 colors)", () => {
		const palette = generatePalette("#ff0000", "triadic");
		expect(palette).toHaveLength(3);
	});

	it("generates analogous palette (5 colors)", () => {
		const palette = generatePalette("#ff0000", "analogous");
		expect(palette).toHaveLength(5);
	});

	it("generates monochromatic palette (5 colors)", () => {
		const palette = generatePalette("#3b82f6", "monochromatic");
		expect(palette).toHaveLength(5);
	});

	it("generates split complementary palette (3 colors)", () => {
		const palette = generatePalette("#ff0000", "split");
		expect(palette).toHaveLength(3);
	});

	it("all colors in palette are valid hex", () => {
		const palette = generatePalette("#3b82f6", "triadic");
		for (const color of palette) {
			expect(hexToRgb(color)).not.toBeNull();
		}
	});
});
