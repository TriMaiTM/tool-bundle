import { useEffect, useState } from "preact/hooks";

interface GradientResult {
	name: string;
	nameVi: string;
	from: string;
	to: string;
}

function hexToHsl(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	const r = (Number.parseInt(clean.substring(0, 2), 16) || 0) / 255;
	const g = (Number.parseInt(clean.substring(2, 4), 16) || 0) / 255;
	const b = (Number.parseInt(clean.substring(4, 6), 16) || 0) / 255;

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
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
	h /= 360;
	s /= 100;
	l /= 100;
	let r = l;
	let g = l;
	let b = l;

	if (s !== 0) {
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

	const toHex = (v: number) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, "0")
			.toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function GradientPaletteGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [baseColor, setBaseColor] = useState("#3B82F6");
	const [gradients, setGradients] = useState<GradientResult[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const t = {
		en: {
			title: "Gradient Palette Generator",
			desc: "Generate harmonic and modern gradient color configurations from a single color. Great for UI/UX background designs.",
			lblBase: "Base Color Input",
			lblResults: "Harmonic Gradient Palette",
			copyCss: "Copy CSS",
			copied: "Copied!",
		},
		vi: {
			title: "Tạo bảng màu Gradient",
			desc: "Tự động sinh ra cấu hình màu dải chuyển sắc (gradient) hài hòa hiện đại từ một màu gốc. Phù hợp cho thiết kế giao diện UI/UX.",
			lblBase: "Màu cơ bản đầu vào",
			lblResults: "Bộ phối màu Gradient hài hòa",
			copyCss: "Sao chép CSS",
			copied: "Đã chép!",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Generate gradients when base changes
	useEffect(() => {
		if (!/^#[0-9A-F]{6}$/i.test(baseColor)) return;

		const [h, s, l] = hexToHsl(baseColor);

		const list: GradientResult[] = [
			{
				name: "Complementary Contrast",
				nameVi: "Tương phản Bổ sung",
				from: baseColor.toUpperCase(),
				to: hslToHex((h + 180) % 360, s, l),
			},
			{
				name: "Analogous Warm",
				nameVi: "Tương đồng Ấm áp",
				from: baseColor.toUpperCase(),
				to: hslToHex((h + 30) % 360, Math.min(100, s + 10), Math.max(20, l - 5)),
			},
			{
				name: "Analogous Cool",
				nameVi: "Tương đồng Mát dịu",
				from: baseColor.toUpperCase(),
				to: hslToHex((h - 30 + 360) % 360, s, Math.min(90, l + 10)),
			},
			{
				name: "Monochromatic Light",
				nameVi: "Đơn sắc Sáng dần",
				from: hslToHex(h, s, Math.max(15, l - 15)),
				to: hslToHex(h, Math.max(20, s - 10), Math.min(95, l + 25)),
			},
			{
				name: "Sunset Blend",
				nameVi: "Dải màu Hoàng hôn",
				from: baseColor.toUpperCase(),
				to: hslToHex((h + 50) % 360, Math.min(100, s + 15), Math.max(30, l - 10)),
			},
			{
				name: "Ocean Glow",
				nameVi: "Hải dương rực rỡ",
				from: baseColor.toUpperCase(),
				to: hslToHex((h - 60 + 360) % 360, Math.min(100, s + 20), Math.max(20, l - 15)),
			},
		];

		setGradients(list);
	}, [baseColor]);

	const handleCopy = (from: string, to: string, index: number) => {
		const cssCode = `background-image: linear-gradient(135deg, ${from.toLowerCase()}, ${to.toLowerCase()});`;
		navigator.clipboard.writeText(cssCode);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration controllers */}
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
				</div>

				{/* Results Cards List */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{gradients.map((grad, idx) => {
							const gradientStyle = `linear-gradient(135deg, ${grad.from}, ${grad.to})`;
							const isCopied = copiedIndex === idx;

							return (
								<div
									key={idx}
									class="bg-surface-soft border border-hairline rounded-lg overflow-hidden shadow-sm flex flex-col group"
								>
									{/* Gradient Swatch Preview */}
									<div class="w-full h-24 relative" style={{ backgroundImage: gradientStyle }} />

									{/* Info & Copy bar */}
									<div class="p-3.5 space-y-2 flex-grow flex flex-col justify-between">
										<div>
											<span class="text-body-sm-strong text-ink font-bold block">
												{lang === "en" ? grad.name : grad.nameVi}
											</span>
											<span class="text-[10px] font-mono text-muted block mt-0.5">
												{grad.from} → {grad.to}
											</span>
										</div>

										<button
											class="btn-secondary w-full py-1.5 text-[10px] uppercase font-bold"
											onClick={() => handleCopy(grad.from, grad.to, idx)}
										>
											{isCopied ? t.copied : t.copyCss}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
