import { useState, useMemo } from "preact/hooks";

export default function ColorFormatConverter() {
	const [input, setInput] = useState("#3B82F6");

	const result = useMemo(() => {
		const clean = input.trim();
		const rgb = parseColor(clean);
		if (!rgb) return null;
		const [r, g, b] = rgb;
		const hex =
			`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
		const [h, s, l] = rgbToHsl(r, g, b);
		const [c, m, y, k] = rgbToCmyk(r, g, b);
		return {
			hex,
			rgb: `rgb(${r}, ${g}, ${b})`,
			hsl: `hsl(${h}, ${s}%, ${l}%)`,
			cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`,
			preview: hex,
			r,
			g,
			b,
			h,
			s,
			l,
			c,
			m,
			y,
			k,
		};
	}, [input]);

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	const formats = result
		? [
				{ label: "HEX", value: result.hex },
				{ label: "RGB", value: result.rgb },
				{ label: "HSL", value: result.hsl },
				{ label: "CMYK", value: result.cmyk },
			]
		: [];

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Enter Color (any format)</label>
				<div class="flex gap-3">
					<input
						class="input"
						style="font-family: var(--font-mono)"
						placeholder="#FF5733, rgb(255,87,51), hsl(14,100%,60%)"
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
					{result && (
						<div
							style={`width: 44px; height: 44px; border-radius: 16px; background: ${result.preview}; border: 1px solid var(--color-hairline); flex-shrink: 0;`}
						/>
					)}
				</div>
				<div class="text-caption text-muted mt-1">Supports: #HEX, rgb(), hsl(), cmyk()</div>
			</div>
			{result ? (
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{formats.map((f) => (
						<div class="bg-surface-card rounded-lg p-4">
							<div class="text-caption-uppercase text-muted mb-1">{f.label}</div>
							<div class="flex items-center justify-between">
								<code class="text-body-sm" style="font-family: var(--font-mono)">
									{f.value}
								</code>
								<button
									class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
									onClick={() => handleCopy(f.value)}
								>
									Copy
								</button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div class="text-body-sm text-muted">Enter a valid color to see conversions</div>
			)}
		</div>
	);
}

function parseColor(input: string): [number, number, number] | null {
	const hexMatch = input.match(/^#?([0-9a-fA-F]{3,8})$/);
	if (hexMatch) {
		let hex = hexMatch[1];
		if (hex.length === 3)
			hex = hex
				.split("")
				.map((c) => c + c)
				.join("");
		if (hex.length === 6 || hex.length === 8)
			return [
				Number.parseInt(hex.slice(0, 2), 16),
				Number.parseInt(hex.slice(2, 4), 16),
				Number.parseInt(hex.slice(4, 6), 16),
			];
	}
	const rgbMatch = input.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
	if (rgbMatch)
		return [
			Number.parseInt(rgbMatch[1]),
			Number.parseInt(rgbMatch[2]),
			Number.parseInt(rgbMatch[3]),
		];
	const hslMatch = input.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
	if (hslMatch)
		return hslToRgb(
			Number.parseInt(hslMatch[1]),
			Number.parseInt(hslMatch[2]),
			Number.parseInt(hslMatch[3]),
		);
	return null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
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
	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	h /= 360;
	s /= 100;
	l /= 100;
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
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
	return [
		Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
		Math.round(hue2rgb(p, q, h) * 255),
		Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
	];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
	if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
	const c = 1 - r / 255;
	const m = 1 - g / 255;
	const y = 1 - b / 255;
	const k = Math.min(c, m, y);
	return [
		Math.round(((c - k) / (1 - k)) * 100),
		Math.round(((m - k) / (1 - k)) * 100),
		Math.round(((y - k) / (1 - k)) * 100),
		Math.round(k * 100),
	];
}
