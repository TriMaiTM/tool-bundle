import { useCallback, useMemo, useState } from "preact/hooks";

const UNITS = [
	"px",
	"em",
	"rem",
	"%",
	"vh",
	"vw",
	"pt",
	"pc",
	"in",
	"cm",
	"mm",
	"ex",
	"ch",
] as const;

type Unit = (typeof UNITS)[number];

interface Preset {
	label: string;
	baseFontSize: number;
}

const PRESETS: Preset[] = [
	{ label: "16px (default)", baseFontSize: 16 },
	{ label: "14px", baseFontSize: 14 },
	{ label: "10px", baseFontSize: 10 },
];

// Conversion factors to px (at given base font size and viewport)
function toPx(value: number, unit: Unit, baseFontSize: number): number {
	switch (unit) {
		case "px":
			return value;
		case "em":
		case "rem":
			return value * baseFontSize;
		case "%":
			return (value / 100) * baseFontSize;
		case "vh":
			return (value / 100) * (typeof window !== "undefined" ? window.innerHeight : 900);
		case "vw":
			return (value / 100) * (typeof window !== "undefined" ? window.innerWidth : 1440);
		case "pt":
			return value * (96 / 72);
		case "pc":
			return value * 16;
		case "in":
			return value * 96;
		case "cm":
			return value * (96 / 2.54);
		case "mm":
			return value * (96 / 25.4);
		case "ex":
			return value * (baseFontSize * 0.5);
		case "ch":
			return value * (baseFontSize * 0.6);
		default:
			return value;
	}
}

function fromPx(px: number, unit: Unit, baseFontSize: number): number {
	switch (unit) {
		case "px":
			return px;
		case "em":
		case "rem":
			return px / baseFontSize;
		case "%":
			return (px / baseFontSize) * 100;
		case "vh":
			return (px / (typeof window !== "undefined" ? window.innerHeight : 900)) * 100;
		case "vw":
			return (px / (typeof window !== "undefined" ? window.innerWidth : 1440)) * 100;
		case "pt":
			return px * (72 / 96);
		case "pc":
			return px / 16;
		case "in":
			return px / 96;
		case "cm":
			return px * (2.54 / 96);
		case "mm":
			return px * (25.4 / 96);
		case "ex":
			return px / (baseFontSize * 0.5);
		case "ch":
			return px / (baseFontSize * 0.6);
		default:
			return px;
	}
}

function formatResult(value: number): string {
	if (Number.isNaN(value) || !Number.isFinite(value)) return "—";
	if (Number.isInteger(value)) return value.toString();
	return value.toFixed(4).replace(/\.?0+$/, "");
}

export default function CssUnitsConverter() {
	const [inputValue, setInputValue] = useState("16");
	const [fromUnit, setFromUnit] = useState<Unit>("px");
	const [toUnit, setToUnit] = useState<Unit>("rem");
	const [baseFontSize, setBaseFontSize] = useState(16);
	const [copied, setCopied] = useState(false);

	const result = useMemo(() => {
		const val = Number.parseFloat(inputValue);
		if (Number.isNaN(val)) return null;
		const px = toPx(val, fromUnit, baseFontSize);
		return fromPx(px, toUnit, baseFontSize);
	}, [inputValue, fromUnit, toUnit, baseFontSize]);

	const formula = useMemo(() => {
		const val = Number.parseFloat(inputValue);
		if (Number.isNaN(val)) return "";
		const px = toPx(val, fromUnit, baseFontSize);
		return `${formatResult(val)} ${fromUnit} = ${formatResult(px)} px → ${formatResult(result ?? 0)} ${toUnit}`;
	}, [inputValue, fromUnit, toUnit, baseFontSize, result]);

	const handleCopy = useCallback(async () => {
		if (result === null) return;
		const text = `${formatResult(result)} ${toUnit}`;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [result, toUnit]);

	const handleSwap = useCallback(() => {
		setFromUnit(toUnit);
		setToUnit(fromUnit);
	}, [fromUnit, toUnit]);

	return (
		<div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">Value</label>
						<input
							type="number"
							class="input w-full"
							value={inputValue}
							onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
							placeholder="Enter value"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">From Unit</label>
							<select
								class="input w-full"
								value={fromUnit}
								onChange={(e) => setFromUnit((e.target as HTMLSelectElement).value as Unit)}
							>
								{UNITS.map((u) => (
									<option key={u} value={u}>
										{u}
									</option>
								))}
							</select>
						</div>
						<div>
							<label class="text-caption-uppercase text-muted block mb-1">To Unit</label>
							<select
								class="input w-full"
								value={toUnit}
								onChange={(e) => setToUnit((e.target as HTMLSelectElement).value as Unit)}
							>
								{UNITS.map((u) => (
									<option key={u} value={u}>
										{u}
									</option>
								))}
							</select>
						</div>
					</div>

					<div class="mb-4">
						<button class="btn-secondary w-full" onClick={handleSwap}>
							Swap Units
						</button>
					</div>

					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-1">
							Base Font Size: {baseFontSize}px
						</label>
						<input
							type="range"
							min={8}
							max={32}
							value={baseFontSize}
							onInput={(e) => setBaseFontSize(Number((e.target as HTMLInputElement).value))}
							class="w-full"
						/>
					</div>

					<div class="mb-4">
						<label class="text-caption-uppercase text-muted block mb-2">Presets</label>
						<div class="flex flex-wrap gap-2">
							{PRESETS.map((p) => (
								<button
									key={p.baseFontSize}
									class={`btn-secondary text-body-sm ${baseFontSize === p.baseFontSize ? "btn-primary" : ""}`}
									onClick={() => setBaseFontSize(p.baseFontSize)}
								>
									{p.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div>
					<div class="card p-6">
						<label class="text-caption-uppercase text-muted block mb-2">Result</label>
						<div class="text-center py-4">
							<div class="text-display-lg font-bold mb-2">
								{result !== null ? formatResult(result) : "—"}
							</div>
							<div class="text-body-lg text-muted">{toUnit}</div>
						</div>

						{formula && (
							<div class="mt-4 p-3 rounded bg-surface-elevated">
								<label class="text-caption-uppercase text-muted block mb-1">Formula</label>
								<code class="text-body-sm font-mono break-all">{formula}</code>
							</div>
						)}

						<div class="mt-4 flex gap-2">
							<button class="btn-primary flex-1" onClick={handleCopy}>
								{copied ? "Copied!" : "Copy Result"}
							</button>
						</div>
					</div>

					<div class="card p-4 mt-4">
						<label class="text-caption-uppercase text-muted block mb-2">Quick Reference</label>
						<div class="text-body-sm text-muted space-y-1">
							<div>
								<strong>em/rem</strong> — relative to font size
							</div>
							<div>
								<strong>%</strong> — percentage of parent font size
							</div>
							<div>
								<strong>vh/vw</strong> — viewport height/width
							</div>
							<div>
								<strong>pt/pc</strong> — print units (1pt = 1/72in)
							</div>
							<div>
								<strong>ex/ch</strong> — x-height / character width
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
