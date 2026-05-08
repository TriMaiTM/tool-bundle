import { useState, useCallback } from "preact/hooks";

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

export default function RgbToHsl() {
	const [r, setR] = useState(102);
	const [g, setG] = useState(153);
	const [b, setB] = useState(204);

	const [h, s, l] = rgbToHsl(r, g, b);
	const hex =
		`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

	const handleHslChange = (newH: number, newS: number, newL: number) => {
		const [nr, ng, nb] = hslToRgb(newH, newS, newL);
		setR(nr);
		setG(ng);
		setB(nb);
	};

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	return (
		<div>
			<div class="flex items-center gap-4 mb-6">
				<div
					style={`width: 80px; height: 80px; border-radius: 16px; background: rgb(${r}, ${g}, ${b}); border: 1px solid var(--color-hairline);`}
				/>
				<div>
					<div class="text-body-strong">
						RGB({r}, {g}, {b})
					</div>
					<div class="text-body-sm text-muted">
						HSL({h}°, {s}%, {l}%)
					</div>
					<div class="text-body-sm text-muted" style="font-family: var(--font-mono)">
						{hex}
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h3 class="text-heading-md mb-3">RGB</h3>
					{[
						{ label: "R", value: r, setter: setR, color: "#ef4444" },
						{ label: "G", value: g, setter: setG, color: "#22c55e" },
						{ label: "B", value: b, setter: setB, color: "#3b82f6" },
					].map((item) => (
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1">
								<label class="text-caption text-muted">{item.label}</label>
								<span class="text-caption text-muted">{item.value}</span>
							</div>
							<input
								type="range"
								min="0"
								max="255"
								value={item.value}
								onInput={(e) => item.setter(Number((e.target as HTMLInputElement).value))}
								style={`width: 100%; accent-color: ${item.color};`}
							/>
						</div>
					))}
				</div>
				<div>
					<h3 class="text-heading-md mb-3">HSL</h3>
					{[
						{ label: "H", value: h, max: 360, color: "#e60023" },
						{ label: "S", value: s, max: 100, color: "#f59e0b" },
						{ label: "L", value: l, max: 100, color: "#888" },
					].map((item) => (
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1">
								<label class="text-caption text-muted">{item.label}</label>
								<span class="text-caption text-muted">
									{item.value}
									{item.label === "H" ? "°" : "%"}
								</span>
							</div>
							<input
								type="range"
								min="0"
								max={item.max}
								value={item.value}
								onInput={(e) => {
									const v = Number((e.target as HTMLInputElement).value);
									const [nh, ns, nl] =
										item.label === "H" ? [v, s, l] : item.label === "S" ? [h, v, l] : [h, s, v];
									handleHslChange(nh, ns, nl);
								}}
								style={`width: 100%; accent-color: ${item.color};`}
							/>
						</div>
					))}
				</div>
			</div>

			<div class="flex flex-wrap gap-2 mt-4">
				<button class="btn-secondary" onClick={() => handleCopy(hex)}>
					Copy HEX
				</button>
				<button class="btn-secondary" onClick={() => handleCopy(`rgb(${r}, ${g}, ${b})`)}>
					Copy RGB
				</button>
				<button class="btn-secondary" onClick={() => handleCopy(`hsl(${h}, ${s}%, ${l}%)`)}>
					Copy HSL
				</button>
			</div>
		</div>
	);
}
