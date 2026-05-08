import { useCallback, useMemo, useState } from "preact/hooks";
import { type Hsl, hexToHsl, hslToHex } from "../../utils/color";
import { downloadText } from "../../utils/download";

type OutputFormat = "css" | "tailwind" | "scss";

interface ColorShade {
	name: string;
	hex: string;
}

function generateShades(baseHsl: Hsl, namePrefix: string): ColorShade[] {
	const { h, s } = baseHsl;
	const lightnessMap: Record<string, number> = {
		"50": 97,
		"100": 93,
		"200": 86,
		"300": 76,
		"400": 64,
		"500": 50,
		"600": 40,
		"700": 32,
		"800": 24,
		"900": 17,
		"950": 10,
	};

	return Object.entries(lightnessMap).map(([shade, lightness]) => ({
		name: `${namePrefix}-${shade}`,
		hex: hslToHex(h, s, lightness),
	}));
}

function generateNeutralShades(baseHsl: Hsl): ColorShade[] {
	const { h } = baseHsl;
	const lowSat = Math.min(baseHsl.s, 10);
	const lightnessMap: Record<string, number> = {
		"50": 98,
		"100": 96,
		"200": 91,
		"300": 84,
		"400": 70,
		"500": 55,
		"600": 44,
		"700": 35,
		"800": 23,
		"900": 15,
		"950": 8,
	};

	return Object.entries(lightnessMap).map(([shade, lightness]) => ({
		name: `neutral-${shade}`,
		hex: hslToHex(h, lowSat, lightness),
	}));
}

function generateSemanticColors(baseHsl: Hsl): {
	success: ColorShade[];
	warning: ColorShade[];
	error: ColorShade[];
	info: ColorShade[];
} {
	const semanticHues = {
		success: 142, // green
		warning: 38, // amber
		error: 0, // rose
		info: 217, // blue
	};

	const baseSat = baseHsl.s;
	const semanticSat = Math.max(60, Math.min(baseSat + 10, 90));

	const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
	const lightnessMap: Record<string, number> = {
		"50": 97,
		"100": 93,
		"200": 86,
		"300": 76,
		"400": 64,
		"500": 50,
		"600": 40,
		"700": 32,
		"800": 24,
		"900": 17,
	};

	const makeShades = (hue: number, prefix: string): ColorShade[] =>
		shades.map((shade) => ({
			name: `${prefix}-${shade}`,
			hex: hslToHex(hue, semanticSat, lightnessMap[shade]),
		}));

	return {
		success: makeShades(semanticHues.success, "success"),
		warning: makeShades(semanticHues.warning, "warning"),
		error: makeShades(semanticHues.error, "error"),
		info: makeShades(semanticHues.info, "info"),
	};
}

function generateCssVariables(
	primary: ColorShade[],
	neutral: ColorShade[],
	semantic: ReturnType<typeof generateSemanticColors>,
): string {
	const allColors = [
		...primary,
		...neutral,
		...semantic.success,
		...semantic.warning,
		...semantic.error,
		...semantic.info,
	];
	const vars = allColors.map((c) => `  --color-${c.name}: ${c.hex};`).join("\n");
	return `:root {\n${vars}\n}`;
}

function generateTailwindConfig(
	primary: ColorShade[],
	neutral: ColorShade[],
	semantic: ReturnType<typeof generateSemanticColors>,
): string {
	const formatGroup = (shades: ColorShade[], name: string) => {
		const entries = shades
			.map((c) => {
				const key = c.name.replace(`${name}-`, "");
				return `          ${key}: '${c.hex}',`;
			})
			.join("\n");
		return `        ${name}: {\n${entries}\n        },`;
	};

	const groups = [
		formatGroup(primary, "primary"),
		formatGroup(neutral, "neutral"),
		formatGroup(semantic.success, "success"),
		formatGroup(semantic.warning, "warning"),
		formatGroup(semantic.error, "error"),
		formatGroup(semantic.info, "info"),
	];

	return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${groups.join("\n")}\n      }\n    }\n  }\n}`;
}

function generateScssVariables(
	primary: ColorShade[],
	neutral: ColorShade[],
	semantic: ReturnType<typeof generateSemanticColors>,
): string {
	const allColors = [
		...primary,
		...neutral,
		...semantic.success,
		...semantic.warning,
		...semantic.error,
		...semantic.info,
	];
	return allColors.map((c) => `$color-${c.name}: ${c.hex};`).join("\n");
}

export default function ColorSystemGenerator() {
	const [baseColor, setBaseColor] = useState("#3b82f6");
	const [activeFormat, setActiveFormat] = useState<OutputFormat>("css");
	const [copied, setCopied] = useState(false);

	const baseHsl = useMemo(() => hexToHsl(baseColor) ?? { h: 217, s: 91, l: 60 }, [baseColor]);

	const primary = useMemo(() => generateShades(baseHsl, "primary"), [baseHsl]);
	const neutral = useMemo(() => generateNeutralShades(baseHsl), [baseHsl]);
	const semantic = useMemo(() => generateSemanticColors(baseHsl), [baseHsl]);

	const cssOutput = useMemo(
		() => generateCssVariables(primary, neutral, semantic),
		[primary, neutral, semantic],
	);
	const tailwindOutput = useMemo(
		() => generateTailwindConfig(primary, neutral, semantic),
		[primary, neutral, semantic],
	);
	const scssOutput = useMemo(
		() => generateScssVariables(primary, neutral, semantic),
		[primary, neutral, semantic],
	);

	const activeOutput = useMemo(() => {
		switch (activeFormat) {
			case "css":
				return cssOutput;
			case "tailwind":
				return tailwindOutput;
			case "scss":
				return scssOutput;
		}
	}, [activeFormat, cssOutput, tailwindOutput, scssOutput]);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(activeOutput);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [activeOutput]);

	const handleDownload = useCallback(() => {
		downloadText(cssOutput, "color-system.css", "text/css");
	}, [cssOutput]);

	return (
		<div class="space-y-6">
			{/* Base color picker */}
			<div class="bg-surface-elevated rounded-lg p-3">
				<label class="text-caption-uppercase text-muted block mb-2">Base Color</label>
				<div class="flex items-center gap-4">
					<input
						type="color"
						value={baseColor}
						onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
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
						value={baseColor}
						onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
						maxLength={7}
					/>
					<div
						class="rounded-lg border-2 border-hairline"
						style={{
							width: "48px",
							height: "36px",
							backgroundColor: baseColor,
						}}
					/>
				</div>
			</div>

			{/* Primary Palette */}
			<div class="bg-surface-elevated rounded-lg p-3">
				<div class="text-title-lg text-primary mb-3">Primary Palette</div>
				<div class="flex flex-wrap gap-2">
					{primary.map((shade) => (
						<div class="flex flex-col items-center gap-1">
							<div
								class="rounded-lg border border-hairline"
								style={{
									width: "56px",
									height: "40px",
									backgroundColor: shade.hex,
								}}
								title={shade.hex}
							/>
							<code
								class="text-caption-uppercase text-muted"
								style="font-family: var(--font-mono); font-size: 10px"
							>
								{shade.name.split("-")[1]}
							</code>
							<code
								class="text-caption-uppercase text-muted"
								style="font-family: var(--font-mono); font-size: 9px"
							>
								{shade.hex}
							</code>
						</div>
					))}
				</div>
			</div>

			{/* Neutral Palette */}
			<div class="bg-surface-elevated rounded-lg p-3">
				<div class="text-title-lg text-primary mb-3">Neutral Palette</div>
				<div class="flex flex-wrap gap-2">
					{neutral.map((shade) => (
						<div class="flex flex-col items-center gap-1">
							<div
								class="rounded-lg border border-hairline"
								style={{
									width: "56px",
									height: "40px",
									backgroundColor: shade.hex,
								}}
								title={shade.hex}
							/>
							<code
								class="text-caption-uppercase text-muted"
								style="font-family: var(--font-mono); font-size: 10px"
							>
								{shade.name.split("-")[1]}
							</code>
							<code
								class="text-caption-uppercase text-muted"
								style="font-family: var(--font-mono); font-size: 9px"
							>
								{shade.hex}
							</code>
						</div>
					))}
				</div>
			</div>

			{/* Semantic Colors */}
			<div class="bg-surface-elevated rounded-lg p-3">
				<div class="text-title-lg text-primary mb-3">Semantic Colors</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{(["success", "warning", "error", "info"] as const).map((key) => (
						<div>
							<div class="text-caption-uppercase text-muted mb-2 capitalize">{key}</div>
							<div class="flex flex-wrap gap-1">
								{semantic[key].map((shade) => (
									<div
										class="rounded border border-hairline"
										style={{
											width: "32px",
											height: "24px",
											backgroundColor: shade.hex,
										}}
										title={`${shade.name}: ${shade.hex}`}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Output format tabs */}
			<div class="flex flex-wrap items-center gap-2 mb-2">
				<div class="flex rounded-md overflow-hidden border border-hairline">
					{(["css", "tailwind", "scss"] as OutputFormat[]).map((fmt) => (
						<button
							class={`px-4 py-2 text-body-sm font-medium transition-colors ${activeFormat === fmt ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
							onClick={() => setActiveFormat(fmt)}
						>
							{fmt === "css"
								? "CSS Variables"
								: fmt === "tailwind"
									? "Tailwind Config"
									: "SCSS Variables"}
						</button>
					))}
				</div>

				<button class="btn-primary text-body-sm" style="height: 36px" onClick={handleCopy}>
					{copied ? "Copied!" : "Copy"}
				</button>
				<button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleDownload}>
					Download CSS
				</button>
			</div>

			{/* Output code block */}
			<pre
				class="code-block rounded-lg p-4 overflow-x-auto"
				style="font-family: var(--font-mono); font-size: 13px; max-height: 400px"
			>
				{activeOutput}
			</pre>
		</div>
	);
}
