import { useState, useMemo } from "preact/hooks";

export default function HexToRgb() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return null;
		const hex = input.trim().replace(/^#/, "");
		const full =
			hex.length === 3
				? hex
						.split("")
						.map((c) => c + c)
						.join("")
				: hex;
		if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
		const r = Number.parseInt(full.slice(0, 2), 16);
		const g = Number.parseInt(full.slice(2, 4), 16);
		const b = Number.parseInt(full.slice(4, 6), 16);
		return {
			r,
			g,
			b,
			hex: `#${full.toUpperCase()}`,
			rgb: `rgb(${r}, ${g}, ${b})`,
			hsl: rgbToHsl(r, g, b),
		};
	}, [input]);

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">HEX Input</label>
				<div class="flex gap-3">
					<input
						class="input"
						style="font-family: var(--font-mono)"
						placeholder="#FF5733 or FF5733"
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
					{result && (
						<div
							style={`width: 44px; height: 44px; border-radius: 16px; background: ${result.hex}; border: 1px solid var(--color-hairline); flex-shrink: 0;`}
						/>
					)}
				</div>
			</div>
			{result && (
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{[
						{ label: "HEX", value: result.hex },
						{ label: "RGB", value: result.rgb },
						{ label: "HSL", value: result.hsl },
					].map((item) => (
						<div class="bg-surface-card rounded-lg p-4">
							<div class="text-caption-uppercase text-muted mb-1">{item.label}</div>
							<div class="flex items-center justify-between">
								<code class="text-body-sm" style="font-family: var(--font-mono)">
									{item.value}
								</code>
								<button
									class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
									onClick={() => handleCopy(item.value)}
								>
									Copy
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function rgbToHsl(r: number, g: number, b: number): string {
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
	return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
