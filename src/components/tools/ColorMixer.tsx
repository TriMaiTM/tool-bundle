import { useCallback, useMemo, useState } from "preact/hooks";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace("#", "");
	return {
		r: Number.parseInt(clean.substring(0, 2), 16),
		g: Number.parseInt(clean.substring(2, 4), 16),
		b: Number.parseInt(clean.substring(4, 6), 16),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b]
		.map((v) =>
			Math.round(Math.max(0, Math.min(255, v)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
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

const PRESET_RATIOS = [
	{ label: "50/50", value: 50 },
	{ label: "25/75", value: 25 },
	{ label: "75/25", value: 75 },
	{ label: "10/90", value: 10 },
	{ label: "90/10", value: 90 },
];

export default function ColorMixer() {
	const [color1, setColor1] = useState("#3b82f6");
	const [color2, setColor2] = useState("#ef4444");
	const [ratio, setRatio] = useState(50);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const mixedRgb = useMemo(() => {
		const c1 = hexToRgb(color1);
		const c2 = hexToRgb(color2);
		const t = ratio / 100;
		return {
			r: Math.round(c1.r * (1 - t) + c2.r * t),
			g: Math.round(c1.g * (1 - t) + c2.g * t),
			b: Math.round(c1.b * (1 - t) + c2.b * t),
		};
	}, [color1, color2, ratio]);

	const mixedHex = useMemo(() => rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b), [mixedRgb]);
	const mixedHsl = useMemo(() => rgbToHsl(mixedRgb.r, mixedRgb.g, mixedRgb.b), [mixedRgb]);

	const formats = useMemo(
		() => [
			{ label: "HEX", value: mixedHex, key: "hex" },
			{ label: "RGB", value: `rgb(${mixedRgb.r}, ${mixedRgb.g}, ${mixedRgb.b})`, key: "rgb" },
			{ label: "HSL", value: `hsl(${mixedHsl.h}, ${mixedHsl.s}%, ${mixedHsl.l}%)`, key: "hsl" },
		],
		[mixedHex, mixedRgb, mixedHsl],
	);

	const handleCopy = useCallback(async (text: string, format: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	}, []);

	const handleSwap = useCallback(() => {
		setColor1(color2);
		setColor2(color1);
	}, [color1, color2]);

	return (
		<div class="space-y-6">
			{/* Color inputs */}
			<div class="flex flex-col sm:flex-row items-start gap-6">
				<div class="flex-1 w-full">
					<label class="text-caption-uppercase text-muted block mb-2">Color 1</label>
					<div class="flex items-center gap-3">
						<input
							type="color"
							value={color1}
							onInput={(e) => setColor1((e.target as HTMLInputElement).value)}
							style={{
								width: "48px",
								height: "36px",
								cursor: "pointer",
								border: "none",
								background: "none",
							}}
						/>
						<input
							type="text"
							class="input flex-1"
							value={color1}
							onInput={(e) => setColor1((e.target as HTMLInputElement).value)}
							placeholder="#3b82f6"
						/>
					</div>
					<div
						class="mt-2 rounded-lg border-2 border-hairline"
						style={{ height: "40px", backgroundColor: color1 }}
					/>
				</div>

				<div class="flex items-center pt-6">
					<button class="btn-secondary" onClick={handleSwap} title="Swap colors">
						⇄
					</button>
				</div>

				<div class="flex-1 w-full">
					<label class="text-caption-uppercase text-muted block mb-2">Color 2</label>
					<div class="flex items-center gap-3">
						<input
							type="color"
							value={color2}
							onInput={(e) => setColor2((e.target as HTMLInputElement).value)}
							style={{
								width: "48px",
								height: "36px",
								cursor: "pointer",
								border: "none",
								background: "none",
							}}
						/>
						<input
							type="text"
							class="input flex-1"
							value={color2}
							onInput={(e) => setColor2((e.target as HTMLInputElement).value)}
							placeholder="#ef4444"
						/>
					</div>
					<div
						class="mt-2 rounded-lg border-2 border-hairline"
						style={{ height: "40px", backgroundColor: color2 }}
					/>
				</div>
			</div>

			{/* Ratio slider */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="flex items-center justify-between mb-3">
					<label class="text-caption-uppercase text-muted">Mixing Ratio</label>
					<span class="text-body-sm text-body-strong">
						{ratio}% Color 2 / {100 - ratio}% Color 1
					</span>
				</div>
				<input
					type="range"
					min={0}
					max={100}
					value={ratio}
					onInput={(e) => setRatio(Number((e.target as HTMLInputElement).value))}
					style="width: 100%"
				/>
				<div class="flex justify-between mt-2 text-caption text-muted">
					<span>100% Color 1</span>
					<span>100% Color 2</span>
				</div>

				{/* Preset ratios */}
				<div class="flex flex-wrap gap-2 mt-4">
					{PRESET_RATIOS.map((preset) => (
						<button
							key={preset.value}
							class={`btn-secondary text-xs ${ratio === preset.value ? "ring-2 ring-primary" : ""}`}
							onClick={() => setRatio(preset.value)}
						>
							{preset.label}
						</button>
					))}
				</div>
			</div>

			{/* Mixed result */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<label class="text-caption-uppercase text-muted block mb-3">Mixed Color</label>
				<div
					class="rounded-lg border-2 border-hairline mb-4"
					style={{ height: "80px", backgroundColor: mixedHex }}
				/>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{formats.map((fmt) => (
						<div key={fmt.key} class="bg-surface-soft rounded-lg p-3">
							<div class="text-caption-uppercase text-muted mb-1">{fmt.label}</div>
							<div class="flex items-center justify-between gap-2">
								<code class="text-sm flex-1 truncate" style="font-family: var(--font-mono)">
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
			</div>

			{/* Gradient preview */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<label class="text-caption-uppercase text-muted block mb-3">Gradient Preview</label>
				<div
					class="rounded-lg border-2 border-hairline"
					style={{
						height: "60px",
						background: `linear-gradient(to right, ${color1}, ${mixedHex}, ${color2})`,
					}}
				/>
			</div>
		</div>
	);
}
