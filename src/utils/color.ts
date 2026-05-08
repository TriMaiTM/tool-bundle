/**
 * Color conversion and utility functions
 * Extracted from tool components for testability
 */

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface Hsl {
	h: number;
	s: number;
	l: number;
}

export function hexToRgb(hex: string): Rgb | null {
	const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
	if (!match) return null;
	return {
		r: Number.parseInt(match[1], 16),
		g: Number.parseInt(match[2], 16),
		b: Number.parseInt(match[3], 16),
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b]
		.map((v) =>
			Math.max(0, Math.min(255, Math.round(v)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
	h /= 360;
	s /= 100;
	l /= 100;

	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

export function hexToHsl(hex: string): Hsl | null {
	const rgb = hexToRgb(hex);
	if (!rgb) return null;
	return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export function hslToHex(h: number, s: number, l: number): string {
	const rgb = hslToRgb(h, s, l);
	return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Calculate relative luminance for WCAG contrast
 */
export function relativeLuminance(r: number, g: number, b: number): number {
	const [rs, gs, bs] = [r, g, b].map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function calculateContrastRatio(fg: Rgb, bg: Rgb): number {
	const l1 = relativeLuminance(fg.r, fg.g, fg.b);
	const l2 = relativeLuminance(bg.r, bg.g, bg.b);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export type PaletteType = "complementary" | "triadic" | "analogous" | "monochromatic" | "split";

export function generatePalette(hex: string, type: PaletteType): string[] {
	const hsl = hexToHsl(hex);
	if (!hsl) return [hex];

	const { h, s, l } = hsl;

	switch (type) {
		case "complementary":
			return [hex, hslToHex((h + 180) % 360, s, l)];
		case "triadic":
			return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
		case "analogous":
			return [
				hslToHex((h + 330) % 360, s, l),
				hslToHex((h + 345) % 360, s, l),
				hex,
				hslToHex((h + 15) % 360, s, l),
				hslToHex((h + 30) % 360, s, l),
			];
		case "monochromatic":
			return [
				hslToHex(h, s, Math.max(l - 30, 5)),
				hslToHex(h, s, Math.max(l - 15, 5)),
				hex,
				hslToHex(h, s, Math.min(l + 15, 95)),
				hslToHex(h, s, Math.min(l + 30, 95)),
			];
		case "split":
			return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
		default:
			return [hex];
	}
}
