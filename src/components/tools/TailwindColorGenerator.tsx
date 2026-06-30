import { useEffect, useState } from "preact/hooks";

interface ColorWeight {
	weight: number;
	hex: string;
}

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	const r = Number.parseInt(clean.substring(0, 2), 16) || 0;
	const g = Number.parseInt(clean.substring(2, 4), 16) || 0;
	const b = Number.parseInt(clean.substring(4, 6), 16) || 0;
	return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blend(
	rgb1: [number, number, number],
	rgb2: [number, number, number],
	ratio: number,
): [number, number, number] {
	return [
		Math.round(rgb1[0] * ratio + rgb2[0] * (1 - ratio)),
		Math.round(rgb1[1] * ratio + rgb2[1] * (1 - ratio)),
		Math.round(rgb1[2] * ratio + rgb2[2] * (1 - ratio)),
	];
}

export default function TailwindColorGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [baseColor, setBaseColor] = useState("#3B82F6");
	const [keyName, setKeyName] = useState("brand");
	const [palette, setPalette] = useState<ColorWeight[]>([]);
	const [copiedWeight, setCopiedWeight] = useState<number | null>(null);
	const [copiedConfig, setCopiedConfig] = useState(false);

	const t = {
		en: {
			title: "Tailwind Color Palette Generator",
			desc: "Generate custom Tailwind-compatible color shades (50-950) from a base color, mathematically blended with white and black.",
			lblBase: "Base Color Input",
			lblResults: "Tailwind Color Shades",
			lblExport: "tailwind.config.js Object",
			lblName: "Config Color Key",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Tạo bảng màu Tailwind CSS",
			desc: "Tạo các mức độ sắc độ màu chuẩn (50-950) tương thích với Tailwind CSS từ một màu cơ bản dùng giải thuật hòa trộn màu sắc.",
			lblBase: "Màu cơ bản đầu vào",
			lblResults: "Sắc độ màu Tailwind",
			lblExport: "Cấu hình đối tượng tailwind.config.js",
			lblName: "Tên khóa màu cấu hình",
			copied: "Đã chép!",
			copy: "Sao chép",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generate tailwind shades
	useEffect(() => {
		if (!/^#[0-9A-F]{6}$/i.test(baseColor)) return;

		const baseRgb = hexToRgb(baseColor);
		const white: [number, number, number] = [255, 255, 255];
		const dark: [number, number, number] = [10, 10, 10]; // Extreme dark for 950

		const weights: ColorWeight[] = [
			{ weight: 50, hex: rgbToHex(...blend(baseRgb, white, 0.08)) },
			{ weight: 100, hex: rgbToHex(...blend(baseRgb, white, 0.2)) },
			{ weight: 200, hex: rgbToHex(...blend(baseRgb, white, 0.4)) },
			{ weight: 300, hex: rgbToHex(...blend(baseRgb, white, 0.6)) },
			{ weight: 400, hex: rgbToHex(...blend(baseRgb, white, 0.8)) },
			{ weight: 500, hex: baseColor.toUpperCase() },
			{ weight: 600, hex: rgbToHex(...blend(baseRgb, dark, 0.85)) },
			{ weight: 700, hex: rgbToHex(...blend(baseRgb, dark, 0.7)) },
			{ weight: 800, hex: rgbToHex(...blend(baseRgb, dark, 0.55)) },
			{ weight: 900, hex: rgbToHex(...blend(baseRgb, dark, 0.38)) },
			{ weight: 950, hex: rgbToHex(...blend(baseRgb, dark, 0.22)) },
		];

		setPalette(weights);
	}, [baseColor]);

	const handleCopyWeight = (hex: string, w: number) => {
		navigator.clipboard.writeText(hex);
		setCopiedWeight(w);
		setTimeout(() => setCopiedWeight(null), 1500);
	};

	const getTailwindConfig = () => {
		const key = (keyName.trim() || "brand").toLowerCase().replace(/[^a-z0-9-]/g, "");
		const innerConfig = palette
			.map((item) => `          ${item.weight}: '${item.hex.toLowerCase()}',`)
			.join("\n");
		return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${key}: {\n${innerConfig}\n        }\n      }\n    }\n  }\n}`;
	};

	const handleCopyConfig = () => {
		navigator.clipboard.writeText(getTailwindConfig());
		setCopiedConfig(true);
		setTimeout(() => setCopiedConfig(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Controllers Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Base Color input */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblBase}</label>
						<div class="flex gap-2">
							<input
								type="color"
								class="w-10 h-10 border border-hairline rounded cursor-pointer shrink-0"
								value={baseColor}
								onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
							/>
							<input
								type="text"
								class="input w-full font-mono text-body-sm"
								value={baseColor}
								onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					{/* Config Key Name */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblName}</label>
						<input
							type="text"
							class="input w-full font-mono text-body-sm"
							value={keyName}
							onInput={(e) => setKeyName((e.target as HTMLInputElement).value)}
							placeholder="e.g. brand"
						/>
					</div>

					{/* Config Export Area */}
					{palette.length > 0 && (
						<div class="border-t border-hairline pt-4 space-y-3">
							<label class="text-body-sm-strong text-ink block">{t.lblExport}</label>
							<div class="relative">
								<textarea
									readOnly
									class="input w-full h-44 font-mono text-xs bg-surface-soft"
									value={getTailwindConfig()}
								/>
								<button
									class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
									onClick={handleCopyConfig}
								>
									{copiedConfig ? t.copied : t.copy}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Results Swatches list */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					<div class="space-y-2">
						{palette.map((item) => (
							<div
								key={item.weight}
								class="flex items-center justify-between bg-surface-soft p-2.5 rounded-lg border border-hairline hover:border-primary/30 transition-colors"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded border border-hairline shadow-sm shrink-0"
										style={{ backgroundColor: item.hex }}
									/>
									<div>
										<span class="text-body-sm-strong text-ink font-bold block">{item.weight}</span>
										<span class="text-body-xs text-muted font-mono">{item.hex}</span>
									</div>
								</div>

								<button
									class="btn-secondary text-[10px] py-1.5 px-3"
									onClick={() => handleCopyWeight(item.hex, item.weight)}
								>
									{copiedWeight === item.weight ? t.copied : t.copy}
								</button>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
