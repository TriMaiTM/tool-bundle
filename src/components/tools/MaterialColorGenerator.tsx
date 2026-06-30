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

export default function MaterialColorGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [baseColor, setBaseColor] = useState("#2196F3");
	const [palette, setPalette] = useState<ColorWeight[]>([]);
	const [copiedWeight, setCopiedWeight] = useState<number | null>(null);
	const [exportFormat, setExportFormat] = useState<"css" | "json" | "scss">("css");
	const [copiedExport, setCopiedExport] = useState(false);

	const t = {
		en: {
			title: "Material Color Palette Generator",
			desc: "Input a base color to generate standard Material Design color weights (50-900) based on mathematical color blending.",
			lblBase: "Base Color Input",
			lblResults: "Generated Shades",
			lblExport: "Export Configuration Code",
			copied: "Copied!",
			copy: "Copy",
			copyAll: "Copy All",
		},
		vi: {
			title: "Tạo bảng màu Material Design",
			desc: "Nhập màu cơ bản để tự động tạo các mức độ sắc độ (50-900) theo chuẩn thiết kế Material Design bằng giải thuật trộn màu.",
			lblBase: "Màu cơ bản đầu vào",
			lblResults: "Các tông màu tạo được",
			lblExport: "Mã cấu hình xuất bản",
			copied: "Đã chép!",
			copy: "Sao chép",
			copyAll: "Sao chép tất cả",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generate shades whenever base color changes
	useEffect(() => {
		if (!/^#[0-9A-F]{6}$/i.test(baseColor)) return;

		const baseRgb = hexToRgb(baseColor);
		const white: [number, number, number] = [255, 255, 255];
		const dark: [number, number, number] = [18, 18, 18]; // Material dark background

		const weights: ColorWeight[] = [
			{ weight: 50, hex: rgbToHex(...blend(baseRgb, white, 0.12)) },
			{ weight: 100, hex: rgbToHex(...blend(baseRgb, white, 0.3)) },
			{ weight: 200, hex: rgbToHex(...blend(baseRgb, white, 0.5)) },
			{ weight: 300, hex: rgbToHex(...blend(baseRgb, white, 0.7)) },
			{ weight: 400, hex: rgbToHex(...blend(baseRgb, white, 0.86)) },
			{ weight: 500, hex: baseColor.toUpperCase() },
			{ weight: 600, hex: rgbToHex(...blend(baseRgb, dark, 0.88)) },
			{ weight: 700, hex: rgbToHex(...blend(baseRgb, dark, 0.7)) },
			{ weight: 800, hex: rgbToHex(...blend(baseRgb, dark, 0.53)) },
			{ weight: 900, hex: rgbToHex(...blend(baseRgb, dark, 0.35)) },
		];

		setPalette(weights);
	}, [baseColor]);

	const handleCopyWeight = (hex: string, w: number) => {
		navigator.clipboard.writeText(hex);
		setCopiedWeight(w);
		setTimeout(() => setCopiedWeight(null), 1500);
	};

	const getExportCode = () => {
		if (exportFormat === "json") {
			const obj: Record<string, string> = {};
			for (const item of palette) {
				obj[item.weight] = item.hex;
			}
			return JSON.stringify(obj, null, 2);
		}
		if (exportFormat === "scss") {
			return palette.map((item) => `$material-color-${item.weight}: ${item.hex};`).join("\n");
		}
		return `:root {\n${palette
			.map((item) => `  --material-color-${item.weight}: ${item.hex};`)
			.join("\n")}\n}`;
	};

	const handleCopyExport = () => {
		navigator.clipboard.writeText(getExportCode());
		setCopiedExport(true);
		setTimeout(() => setCopiedExport(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input controllers */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

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

					{/* Export Config */}
					{palette.length > 0 && (
						<div class="border-t border-hairline pt-4 space-y-3">
							<label class="text-body-sm-strong text-ink block">{t.lblExport}</label>
							<div class="flex gap-2">
								{(["css", "scss", "json"] as const).map((fmt) => (
									<button
										key={fmt}
										class={`btn-secondary py-1 px-3 text-xs uppercase ${
											exportFormat === fmt ? "bg-primary/10 border-primary text-primary" : ""
										}`}
										onClick={() => setExportFormat(fmt)}
									>
										{fmt}
									</button>
								))}
							</div>
							<div class="relative">
								<textarea
									readOnly
									class="input w-full h-32 font-mono text-body-sm bg-surface-soft"
									value={getExportCode()}
								/>
								<button
									class="absolute top-2 right-2 btn-secondary py-1 px-2.5 text-[10px]"
									onClick={handleCopyExport}
								>
									{copiedExport ? t.copied : t.copy}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Results panel */}
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
										<span class="text-body-sm-strong text-ink font-bold block">
											{lang === "en" ? `Weight ${item.weight}` : `Độ sáng ${item.weight}`}
										</span>
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
