import { useCallback, useMemo, useState } from "preact/hooks";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	if (!match) return null;
	return {
		r: Number.parseInt(match[1], 16),
		g: Number.parseInt(match[2], 16),
		b: Number.parseInt(match[3], 16),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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

function parseColorInput(input: string): string | null {
	const trimmed = input.trim().toLowerCase();

	// HEX
	const hexMatch = trimmed.match(/^#?([0-9a-f]{6})$/);
	if (hexMatch) return `#${hexMatch[1]}`;

	// RGB
	const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
	if (rgbMatch) {
		const r = Number.parseInt(rgbMatch[1]);
		const g = Number.parseInt(rgbMatch[2]);
		const b = Number.parseInt(rgbMatch[3]);
		if (r <= 255 && g <= 255 && b <= 255) return rgbToHex(r, g, b);
	}

	// HSL
	const hslMatch = trimmed.match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/);
	if (hslMatch) {
		const h = Number.parseInt(hslMatch[1]);
		const s = Number.parseInt(hslMatch[2]);
		const l = Number.parseInt(hslMatch[3]);
		if (h <= 360 && s <= 100 && l <= 100) {
			const rgb = hslToRgb(h, s, l);
			return rgbToHex(rgb.r, rgb.g, rgb.b);
		}
	}

	return null;
}

export default function ColorPicker() {
	const [hexInput, setHexInput] = useState("#faff69");
	const [recentColors, setRecentColors] = useState<string[]>(["#faff69"]);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const currentHex = useMemo(() => {
		const parsed = parseColorInput(hexInput);
		return parsed || "#faff69";
	}, [hexInput]);

	const rgb = useMemo(() => hexToRgb(currentHex) || { r: 250, g: 255, b: 105 }, [currentHex]);
	const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

	const addToRecent = useCallback((color: string) => {
		setRecentColors((prev) => {
			const filtered = prev.filter((c) => c !== color);
			return [color, ...filtered].slice(0, 10);
		});
	}, []);

	const handleColorPickerChange = useCallback(
		(e: Event) => {
			const value = (e.target as HTMLInputElement).value;
			setHexInput(value);
			addToRecent(value);
		},
		[addToRecent],
	);

	const handleHexInput = useCallback(
		(e: Event) => {
			const value = (e.target as HTMLInputElement).value;
			setHexInput(value);
			const parsed = parseColorInput(value);
			if (parsed) addToRecent(parsed);
		},
		[addToRecent],
	);

	const handleCopy = useCallback(async (text: string, format: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	}, []);

	const formats = useMemo(
		() => [
			{ label: "HEX", value: currentHex, key: "hex" },
			{ label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, key: "rgb" },
			{
				label: "HSL",
				value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
				key: "hsl",
			},
		],
		[currentHex, rgb, hsl],
	);

	return (
		<div class="space-y-6">
			{/* Main input area */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="flex flex-col sm:flex-row items-start gap-6">
					{/* Color picker + swatch */}
					<div class="flex items-center gap-4">
						<div
							class="rounded-lg border-2 border-hairline"
							style={{
								width: "80px",
								height: "80px",
								backgroundColor: currentHex,
							}}
						/>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">Pick a Color</label>
							<input
								type="color"
								value={currentHex}
								onInput={handleColorPickerChange}
								style={{
									width: "48px",
									height: "36px",
									cursor: "pointer",
									border: "none",
									background: "none",
								}}
							/>
						</div>
					</div>

					{/* Text input */}
					<div class="flex-1 w-full">
						<label class="text-caption-uppercase text-muted block mb-2">
							Enter Color (HEX, RGB, or HSL)
						</label>
						<input
							type="text"
							class="input w-full"
							value={hexInput}
							onInput={handleHexInput}
							placeholder="#faff69 or rgb(250,255,105) or hsl(63,100%,70%)"
						/>
					</div>
				</div>
			</div>

			{/* Color format values */}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{formats.map((fmt) => (
					<div class="bg-surface-elevated rounded-lg p-3">
						<div class="text-caption-uppercase text-muted mb-1">{fmt.label}</div>
						<div class="flex items-center justify-between gap-2">
							<code
								class="code-block text-sm flex-1 truncate"
								style="font-family: var(--font-mono)"
							>
								{fmt.value}
							</code>
							<button
								class="btn-secondary text-xs whitespace-nowrap"
								onClick={() => handleCopy(fmt.value, fmt.key)}
							>
								{copiedFormat === fmt.key ? "Copied!" : "Copy"}
							</button>
						</div>
					</div>
				))}
			</div>

			{/* Recent colors */}
			{recentColors.length > 0 && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<div class="text-caption-uppercase text-muted mb-3">Recent Colors</div>
					<div class="flex flex-wrap gap-2">
						{recentColors.map((color) => (
							<button
								class="rounded-lg border-2 border-hairline hover:border-primary transition-colors"
								style={{
									width: "40px",
									height: "40px",
									backgroundColor: color,
									cursor: "pointer",
								}}
								onClick={() => {
									setHexInput(color);
									addToRecent(color);
								}}
								title={color}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
