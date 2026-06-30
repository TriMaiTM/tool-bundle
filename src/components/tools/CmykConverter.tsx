import { useEffect, useState } from "preact/hooks";

export default function CmykConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [c, setC] = useState(0);
	const [m, setM] = useState(100);
	const [y, setY] = useState(100);
	const [k, setK] = useState(0);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "CMYK Color Converter",
			desc: "Convert CMYK (Cyan, Magenta, Yellow, Key) print colors to digital formats (HEX, RGB, HSL) with live visual previews.",
			lblCyan: "Cyan (C)",
			lblMagenta: "Magenta (M)",
			lblYellow: "Yellow (Y)",
			lblKey: "Key / Black (K)",
			lblPreview: "Color Preview",
			lblResults: "Converted Values",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Bộ chuyển đổi màu CMYK",
			desc: "Chuyển đổi hệ màu in ấn CMYK (Cyan, Magenta, Yellow, Key) sang các định dạng hiển thị số (HEX, RGB, HSL) kèm xem trước trực quan.",
			lblCyan: "Xanh lam (C)",
			lblMagenta: "Hồng sẫm (M)",
			lblYellow: "Vàng (Y)",
			lblKey: "Đen / Key (K)",
			lblPreview: "Xem trước màu sắc",
			lblResults: "Giá trị quy đổi",
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

	// Convert CMYK to RGB
	const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
	const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
	const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));

	// Convert RGB to HEX
	const toHexStr = (val: number) => val.toString(16).padStart(2, "0");
	const hex = `#${toHexStr(r)}${toHexStr(g)}${toHexStr(b)}`.toUpperCase();

	// Convert RGB to HSL
	const getHsl = () => {
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = b / 255;
		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case rNorm:
					h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
					break;
				case gNorm:
					h = (bNorm - rNorm) / d + 2;
					break;
				case bNorm:
					h = (rNorm - gNorm) / d + 4;
					break;
			}
			h /= 6;
		}

		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			l: Math.round(l * 100),
		};
	};

	const hsl = getHsl();
	const rgbStr = `rgb(${r}, ${g}, ${b})`;
	const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
	const cmykStr = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input sliders panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Cyan */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblCyan}</label>
							<span class="font-mono text-primary">{c}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={c}
							onInput={(e) => setC(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Magenta */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblMagenta}</label>
							<span class="font-mono text-primary">{m}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={m}
							onInput={(e) => setM(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Yellow */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblYellow}</label>
							<span class="font-mono text-primary">{y}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={y}
							onInput={(e) => setY(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Key */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblKey}</label>
							<span class="font-mono text-primary">{k}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={k}
							onInput={(e) => setK(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>
				</div>

				{/* Preview and results panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Color Swatch Preview */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblPreview}
						</h4>
						<div class="flex flex-col sm:flex-row items-center gap-6">
							<div
								class="w-24 h-24 rounded-lg border border-hairline shadow-inner shrink-0"
								style={{ backgroundColor: hex }}
							/>
							<div class="space-y-1.5 w-full">
								<div class="text-body-sm text-ink">
									RGB:{" "}
									<span class="font-mono font-bold">
										{r}, {g}, {b}
									</span>
								</div>
								<div class="text-body-sm text-ink">
									HEX: <span class="font-mono font-bold">{hex}</span>
								</div>
								<div class="text-body-sm text-ink">
									HSL:{" "}
									<span class="font-mono font-bold">
										{hsl.h}°, {hsl.s}%, {hsl.l}%
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Output Textfields */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h4>

						<div class="space-y-3">
							{[
								{ label: "HEX", val: hex },
								{ label: "RGB", val: rgbStr },
								{ label: "HSL", val: hslStr },
								{ label: "CMYK", val: cmykStr },
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
