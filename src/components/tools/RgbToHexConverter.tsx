import { useEffect, useState } from "preact/hooks";

export default function RgbToHexConverter() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [r, setR] = useState(255);
	const [g, setG] = useState(87);
	const [b, setB] = useState(51);
	const [a, setA] = useState(1);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "RGB to HEX Converter",
			desc: "Convert RGB and RGBA color models to Hexadecimal formats (including 8-character HEX for transparency).",
			lblRed: "Red",
			lblGreen: "Green",
			lblBlue: "Blue",
			lblAlpha: "Alpha (Opacity)",
			lblPreview: "Color Swatch",
			lblResult: "Hexadecimal Output",
			copied: "Copied!",
			copy: "Copy",
			prefix: "Prefix with '#'",
		},
		vi: {
			title: "Chuyển đổi RGB sang HEX",
			desc: "Chuyển đổi hệ màu RGB và RGBA sang mã màu Thập lục phân HEX (bao gồm cả mã HEX 8 ký tự cho độ trong suốt).",
			lblRed: "Đỏ",
			lblGreen: "Xanh lục",
			lblBlue: "Xanh lam",
			lblAlpha: "Độ trong suốt (Alpha)",
			lblPreview: "Mẫu màu sắc",
			lblResult: "Mã màu HEX quy đổi",
			copied: "Đã chép!",
			copy: "Sao chép",
			prefix: "Thêm dấu '#'",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const toHex = (val: number) => val.toString(16).padStart(2, "0").toUpperCase();

	const hex6 = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	const alphaByte = Math.round(a * 255);
	const hex8 = `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaByte)}`;
	const rgbaCss = `rgba(${r}, ${g}, ${b}, ${a})`;

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* RGB inputs panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Red */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblRed}</label>
							<span class="font-mono text-primary">{r}</span>
						</div>
						<input
							type="range"
							min="0"
							max="255"
							value={r}
							onInput={(e) => setR(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Green */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblGreen}</label>
							<span class="font-mono text-primary">{g}</span>
						</div>
						<input
							type="range"
							min="0"
							max="255"
							value={g}
							onInput={(e) => setG(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Blue */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblBlue}</label>
							<span class="font-mono text-primary">{b}</span>
						</div>
						<input
							type="range"
							min="0"
							max="255"
							value={b}
							onInput={(e) => setB(Number((e.target as HTMLInputElement).value))}
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

				{/* Swatch and results panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Swatch with transparent checkerboard background */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblPreview}
						</h4>
						<div class="flex flex-col sm:flex-row items-center gap-6">
							{/* Checkerboard background wrapper */}
							<div
								class="w-24 h-24 rounded-lg border border-hairline shadow-inner shrink-0 overflow-hidden relative"
								style={{
									backgroundImage:
										"linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
									backgroundSize: "16px 16px",
									backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
								}}
							>
								<div class="w-full h-full absolute inset-0" style={{ backgroundColor: rgbaCss }} />
							</div>
							<div class="space-y-1.5 w-full">
								<div class="text-body-sm text-ink">
									RGBA: <span class="font-mono font-bold">{rgbaCss}</span>
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
								{ label: "CSS RGBA", val: rgbaCss },
							].map((item) => (
								<div key={item.label} class="space-y-1.5">
									<label class="text-caption-uppercase text-muted block">{item.label}</label>
									<div class="relative">
										<input
											readOnly
											type="text"
											class="input w-full font-mono text-body-sm bg-surface-soft pr-20"
											value={item.val}
										/>
										<button
											class="absolute top-1/2 right-2 -translate-y-1/2 btn-secondary py-1 px-2.5 text-[10px]"
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
