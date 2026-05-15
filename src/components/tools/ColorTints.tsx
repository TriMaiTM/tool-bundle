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

function generateTints(hex: string, count = 10): string[] {
	const rgb = hexToRgb(hex);
	const tints: string[] = [];
	for (let i = 0; i < count; i++) {
		const factor = (i + 1) / (count + 1);
		tints.push(
			rgbToHex(
				rgb.r + (255 - rgb.r) * factor,
				rgb.g + (255 - rgb.g) * factor,
				rgb.b + (255 - rgb.b) * factor,
			),
		);
	}
	return tints;
}

export default function ColorTints() {
	const [hexInput, setHexInput] = useState("#3b82f6");
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState<string | null>(null);

	const currentHex = useMemo(() => {
		const clean = hexInput.replace("#", "");
		if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean}`;
		return "#3b82f6";
	}, [hexInput]);

	const tints = useMemo(() => generateTints(currentHex), [currentHex]);

	const handleCopy = useCallback(async (text: string, index: number) => {
		await navigator.clipboard.writeText(text);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	}, []);

	const handleCopyAllCss = useCallback(async () => {
		const css = tints.map((tint, i) => `  --tint-${(i + 1) * 100}: ${tint};`).join("\n");
		const output = `:root {\n${css}\n}`;
		await navigator.clipboard.writeText(output);
		setCopiedAll("css");
		setTimeout(() => setCopiedAll(null), 1500);
	}, [tints]);

	const handleCopyAllArray = useCallback(async () => {
		const output = JSON.stringify(tints);
		await navigator.clipboard.writeText(output);
		setCopiedAll("array");
		setTimeout(() => setCopiedAll(null), 1500);
	}, [tints]);

	return (
		<div class="space-y-6">
			{/* Input */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="flex flex-col sm:flex-row items-start gap-6">
					<div class="flex items-center gap-4">
						<div
							class="rounded-lg border-2 border-hairline"
							style={{ width: "80px", height: "80px", backgroundColor: currentHex }}
						/>
						<div>
							<label class="text-caption-uppercase text-muted block mb-2">Pick a Color</label>
							<input
								type="color"
								value={currentHex}
								onInput={(e) => setHexInput((e.target as HTMLInputElement).value)}
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

					<div class="flex-1 w-full">
						<label class="text-caption-uppercase text-muted block mb-2">HEX Value</label>
						<input
							type="text"
							class="input w-full"
							value={hexInput}
							onInput={(e) => setHexInput((e.target as HTMLInputElement).value)}
							placeholder="#3b82f6"
						/>
					</div>
				</div>
			</div>

			{/* Gradient preview */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<label class="text-caption-uppercase text-muted block mb-3">Gradient Preview</label>
				<div class="flex rounded-lg overflow-hidden border-2 border-hairline">
					{[currentHex, ...tints].map((color, i) => (
						<div key={i} style={{ flex: 1, height: "60px", backgroundColor: color }} />
					))}
				</div>
			</div>

			{/* Tints */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="flex items-center justify-between mb-4">
					<label class="text-caption-uppercase text-muted">10 Tints</label>
					<div class="flex gap-2">
						<button class="btn-secondary text-xs" onClick={handleCopyAllCss}>
							{copiedAll === "css" ? "Copied!" : "Copy as CSS Variables"}
						</button>
						<button class="btn-secondary text-xs" onClick={handleCopyAllArray}>
							{copiedAll === "array" ? "Copied!" : "Copy as Array"}
						</button>
					</div>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
					{tints.map((tint, i) => (
						<button
							key={i}
							class="rounded-lg border-2 border-hairline p-3 text-center hover:border-primary transition-colors cursor-pointer"
							onClick={() => handleCopy(tint, i)}
							title={`Click to copy ${tint}`}
						>
							<div class="rounded-md mb-2" style={{ height: "48px", backgroundColor: tint }} />
							<code class="text-xs text-body" style="font-family: var(--font-mono)">
								{tint}
							</code>
							<div class="text-caption text-muted mt-1">
								{copiedIndex === i ? "Copied!" : `Tint ${(i + 1) * 100}`}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
