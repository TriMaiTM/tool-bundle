import { useEffect, useState } from "preact/hooks";

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b_ = c * Math.sin(hRad);

	const l_ = l + 0.3963377774 * a + 0.2158037573 * b_;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b_;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b_;

	const l3 = l_ * l_ * l_;
	const m3 = m_ * m_ * m_;
	const s3 = s_ * s_ * s_;

	const x = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
	const y = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
	const z = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

	let rL = +3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
	let gL = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
	let bL = +0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

	const clamp = (val: number) => Math.max(0, Math.min(1, val));
	rL = clamp(rL);
	gL = clamp(gL);
	bL = clamp(bL);

	const gamma = (val: number) =>
		val <= 0.0031308 ? 12.92 * val : 1.055 * val ** (1 / 2.4) - 0.055;
	const r = Math.round(gamma(rL) * 255);
	const g = Math.round(gamma(gL) * 255);
	const b = Math.round(gamma(bL) * 255);

	return [r, g, b];
}

export default function OklchConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [l, setL] = useState(0.6); // Lightness (0-1)
	const [c, setC] = useState(0.15); // Chroma (0-0.4)
	const [h, setH] = useState(150); // Hue (0-360)
	const [a, setA] = useState(1);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "OKLCH Color Converter",
			desc: "Explore and convert the modern OKLCH color space (perceptually uniform L, C, H) to standard HEX, RGB, and HSL formats.",
			lblLightness: "Lightness (L)",
			lblChroma: "Chroma (C)",
			lblHue: "Hue (H)",
			lblAlpha: "Alpha (Opacity)",
			lblPreview: "Color Preview",
			lblResult: "Output Values",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Bộ chuyển đổi màu OKLCH",
			desc: "Khám phá và quy đổi không gian màu hiện đại OKLCH (đồng đều về cảm nhận thị giác L, C, H) sang các định dạng chuẩn HEX, RGB và HSL.",
			lblLightness: "Độ sáng (L)",
			lblChroma: "Độ sắc bão hòa (Chroma - C)",
			lblHue: "Tông màu (Hue - H)",
			lblAlpha: "Độ trong suốt (Alpha - A)",
			lblPreview: "Xem trước màu sắc",
			lblResult: "Giá trị quy đổi đầu ra",
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

	const [r, g, bVal] = oklchToRgb(l, c, h);
	const toHex = (val: number) => val.toString(16).padStart(2, "0").toUpperCase();
	const hex = `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;

	const oklchCss = `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}${a < 1 ? ` / ${a}` : ""})`;
	const rgbStr = `rgba(${r}, ${g}, ${bVal}, ${a})`;

	// HSL calculation
	const getHsl = () => {
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = bVal / 255;
		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		let hue = 0;
		let sat = 0;
		const light = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case rNorm:
					hue = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
					break;
				case gNorm:
					hue = (bNorm - rNorm) / d + 2;
					break;
				case bNorm:
					hue = (rNorm - gNorm) / d + 4;
					break;
			}
			hue /= 6;
		}

		return {
			h: Math.round(hue * 360),
			s: Math.round(sat * 100),
			l: Math.round(light * 100),
		};
	};

	const hsl = getHsl();
	const hslStr = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`;

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Lightness */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblLightness}</label>
							<span class="font-mono text-primary">{(l * 100).toFixed(0)}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={l}
							onInput={(e) => setL(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Chroma */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblChroma}</label>
							<span class="font-mono text-primary">{c.toFixed(3)}</span>
						</div>
						<input
							type="range"
							min="0"
							max="0.4"
							step="0.001"
							value={c}
							onInput={(e) => setC(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Hue */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblHue}</label>
							<span class="font-mono text-primary">{h.toFixed(0)}°</span>
						</div>
						<input
							type="range"
							min="0"
							max="360"
							value={h}
							onInput={(e) => setH(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Alpha */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblAlpha}</label>
							<span class="font-mono text-primary">{a.toFixed(2)}</span>
						</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={a}
							onInput={(e) => setA(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>
				</div>

				{/* Results dashboard */}
				<div class="lg:col-span-7 space-y-6">
					{/* Swatch Preview */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblPreview}
						</h4>
						<div class="flex flex-col sm:flex-row items-center gap-6">
							<div
								class="w-24 h-24 rounded-lg border border-hairline shadow-inner shrink-0 overflow-hidden relative"
								style={{
									backgroundImage:
										"linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
									backgroundSize: "16px 16px",
									backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
								}}
							>
								<div
									class="w-full h-full absolute inset-0"
									style={{ backgroundColor: hex, opacity: a }}
								/>
							</div>
							<div class="space-y-1.5 w-full">
								<div class="text-body-sm text-ink">
									CSS OKLCH: <span class="font-mono font-bold">{oklchCss}</span>
								</div>
								<div class="text-body-sm text-ink">
									HEX equivalent: <span class="font-mono font-bold">{hex}</span>
								</div>
								<div class="text-body-sm text-ink">
									RGB:{" "}
									<span class="font-mono font-bold">
										{r}, {g}, {bVal}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Output Textfields */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResult}
						</h4>

						<div class="space-y-3">
							{[
								{ label: "CSS OKLCH", val: oklchCss },
								{ label: "HEX", val: hex },
								{ label: "RGBA", val: rgbStr },
								{ label: "HSLA", val: hslStr },
							].map((item) => (
								<div key={item.label} class="space-y-1.5">
									<label class="text-caption-uppercase text-muted block">{item.label}</label>
									<div class="flex gap-2">
										<input
											readOnly
											type="text"
											class="input w-full font-mono text-body-sm bg-surface-soft"
											value={item.val}
										/>
										<button
											class="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
											onClick={() => handleCopy(item.val, item.label)}
										>
											{copiedFormat === item.label ? t.copied : t.copy}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
