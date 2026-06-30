import { useEffect, useState } from "preact/hooks";

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default function HslToHexConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [h, setH] = useState(200);
	const [s, setS] = useState(80);
	const [l, setL] = useState(50);
	const [a, setA] = useState(1);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "HSL to HEX Converter",
			desc: "Convert HSL and HSLA color values to 6-character and 8-character HEX codes with precise sliders.",
			lblHue: "Hue (H)",
			lblSat: "Saturation (S)",
			lblLight: "Lightness (L)",
			lblAlpha: "Alpha (Opacity)",
			lblPreview: "Color Swatch",
			lblResult: "Hexadecimal Output",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Chuyển đổi HSL sang HEX",
			desc: "Chuyển đổi hệ màu HSL và HSLA sang mã màu HEX (bao gồm 6 ký tự chuẩn và 8 ký tự cho độ trong suốt).",
			lblHue: "Tông màu (H)",
			lblSat: "Độ bão hòa (S)",
			lblLight: "Độ sáng (L)",
			lblAlpha: "Độ trong suốt (A)",
			lblPreview: "Mẫu màu sắc",
			lblResult: "Mã màu HEX quy đổi",
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

	const [r, g, bVal] = hslToRgb(h, s, l);
	const toHex = (val: number) => val.toString(16).padStart(2, "0").toUpperCase();

	const hex6 = `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
	const alphaByte = Math.round(a * 255);
	const hex8 = `#${toHex(r)}${toHex(g)}${toHex(bVal)}${toHex(alphaByte)}`;
	const hslaCss = `hsla(${h}, ${s}%, ${l}%, ${a})`;

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* HSL input controls */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Hue */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblHue}</label>
							<span class="font-mono text-primary">{h}°</span>
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

					{/* Saturation */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblSat}</label>
							<span class="font-mono text-primary">{s}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={s}
							onInput={(e) => setS(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Lightness */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblLight}</label>
							<span class="font-mono text-primary">{l}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={l}
							onInput={(e) => setL(Number((e.target as HTMLInputElement).value))}
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

				{/* Swatch & Outputs */}
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
								<div class="w-full h-full absolute inset-0" style={{ backgroundColor: hslaCss }} />
							</div>
							<div class="space-y-1.5 w-full">
								<div class="text-body-sm text-ink">
									HSLA: <span class="font-mono font-bold">{hslaCss}</span>
								</div>
								<div class="text-body-sm text-ink">
									HEX (6-char): <span class="font-mono font-bold">{hex6}</span>
								</div>
								<div class="text-body-sm text-ink">
									HEX (8-char): <span class="font-mono font-bold">{hex8}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Outputs */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResult}
						</h4>

						<div class="space-y-3">
							{[
								{ label: "HEX (Standard)", val: hex6 },
								{ label: "HEX (With Alpha)", val: hex8 },
								{ label: "CSS HSLA", val: hslaCss },
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
