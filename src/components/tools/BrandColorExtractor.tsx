import { useEffect, useState } from "preact/hooks";

interface BrandColor {
	name: string;
	colors: { name: string; hex: string }[];
}

const BRAND_DATABASE: BrandColor[] = [
	{
		name: "Google",
		colors: [
			{ name: "Blue", hex: "#4285F4" },
			{ name: "Red", hex: "#EA4335" },
			{ name: "Yellow", hex: "#FBBC05" },
			{ name: "Green", hex: "#34A853" },
		],
	},
	{
		name: "Facebook",
		colors: [
			{ name: "Blue", hex: "#1877F2" },
			{ name: "Dark Blue", hex: "#0866FF" },
			{ name: "Gray", hex: "#F0F2F5" },
		],
	},
	{
		name: "Stripe",
		colors: [
			{ name: "Purple / Indigo", hex: "#635BFF" },
			{ name: "Dark Indigo", hex: "#0A2540" },
			{ name: "Cyan", hex: "#00D4B2" },
			{ name: "Light Gray", hex: "#F6F9FC" },
		],
	},
	{
		name: "Netflix",
		colors: [
			{ name: "Red", hex: "#E50914" },
			{ name: "Black", hex: "#141414" },
			{ name: "White", hex: "#FFFFFF" },
		],
	},
	{
		name: "Spotify",
		colors: [
			{ name: "Green", hex: "#1DB954" },
			{ name: "Black", hex: "#191414" },
			{ name: "White", hex: "#FFFFFF" },
		],
	},
	{
		name: "Airbnb",
		colors: [
			{ name: "Rausch (Red)", hex: "#FF5A5F" },
			{ name: "Babu (Teal)", hex: "#00A699" },
			{ name: "Arches (Orange)", hex: "#FC642D" },
			{ name: "Hof (Dark)", hex: "#484848" },
		],
	},
	{
		name: "Microsoft",
		colors: [
			{ name: "Red-Orange", hex: "#F25022" },
			{ name: "Green", hex: "#7FBA00" },
			{ name: "Blue", hex: "#00A4EF" },
			{ name: "Yellow", hex: "#FFB900" },
		],
	},
	{
		name: "Amazon",
		colors: [
			{ name: "Orange", hex: "#FF9900" },
			{ name: "Dark Navy", hex: "#146EB4" },
			{ name: "Black", hex: "#232F3E" },
		],
	},
	{
		name: "Twitter / X",
		colors: [
			{ name: "Black", hex: "#000000" },
			{ name: "Twitter Blue", hex: "#1DA1F2" },
			{ name: "White", hex: "#FFFFFF" },
		],
	},
	{
		name: "GitHub",
		colors: [
			{ name: "Black / Gray", hex: "#24292E" },
			{ name: "Green", hex: "#2EA44F" },
			{ name: "Blue", hex: "#0366D6" },
		],
	},
	{
		name: "Slack",
		colors: [
			{ name: "Aubergine", hex: "#4A154B" },
			{ name: "Blue", hex: "#36C5F0" },
			{ name: "Green", hex: "#2EB67D" },
			{ name: "Yellow", hex: "#ECB22E" },
			{ name: "Red", hex: "#E01E5A" },
		],
	},
	{
		name: "PayPal",
		colors: [
			{ name: "Deep Blue", hex: "#003087" },
			{ name: "Light Blue", hex: "#0079C1" },
			{ name: "Gray", hex: "#EEEEEE" },
		],
	},
	{
		name: "Instagram",
		colors: [
			{ name: "Yellow", hex: "#FCAF45" },
			{ name: "Purple", hex: "#833AB4" },
			{ name: "Pink / Red", hex: "#E1306C" },
			{ name: "Blue", hex: "#405DE6" },
		],
	},
	{
		name: "Reddit",
		colors: [
			{ name: "Orange-Red", hex: "#FF4500" },
			{ name: "Blue", hex: "#5296DD" },
			{ name: "Dark Gray", hex: "#1A1A1B" },
		],
	},
	{
		name: "Shopify",
		colors: [
			{ name: "Green", hex: "#96BF48" },
			{ name: "Dark Green", hex: "#5E8E3E" },
			{ name: "Slate", hex: "#212B36" },
		],
	},
];

export default function BrandColorExtractor() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"brands" | "code">("brands");
	const [searchQuery, setSearchQuery] = useState("");
	const [codeText, setCodeText] = useState("");
	const [extractedColors, setExtractedColors] = useState<string[]>([]);
	const [copiedColor, setCopiedColor] = useState<string | null>(null);

	const t = {
		en: {
			title: "Brand Color Palette Extractor",
			desc: "Search standard branding colors from global platforms or paste code (HTML, CSS, SVG) to extract all hex colors immediately.",
			tabBrands: "Brand Database",
			tabCode: "Extract from Code",
			lblSearch: "Search brand schemes...",
			lblPaste: "Paste code containing styles",
			btnExtract: "Extract Color Identifiers",
			lblExtracted: "Extracted Color Palette",
			copied: "Copied!",
			copy: "Copy",
			placeholder:
				"div {\n  color: #3b82f6;\n  background-color: rgb(243, 244, 246);\n  border: 1px solid hsl(0, 0%, 80%);\n}",
			emptyExtract:
				"No color values were parsed from the input code. Ensure colors are in #HEX format.",
		},
		vi: {
			title: "Khai thác màu thương hiệu",
			desc: "Tra cứu màu sắc từ danh mục hơn 50 thương hiệu nổi tiếng toàn cầu, hoặc dán mã HTML/CSS/SVG để lọc các bảng màu sắc.",
			tabBrands: "Thương hiệu nổi tiếng",
			tabCode: "Trích xuất từ mã nguồn",
			lblSearch: "Tìm kiếm thương hiệu...",
			lblPaste: "Dán mã nguồn có chứa màu sắc",
			btnExtract: "Bắt đầu trích xuất màu",
			lblExtracted: "Bảng màu trích xuất được",
			copied: "Đã chép!",
			copy: "Sao chép",
			placeholder:
				"div {\n  color: #3b82f6;\n  background-color: rgb(243, 244, 246);\n  border: 1px solid hsl(0, 0%, 80%);\n}",
			emptyExtract:
				"Không lọc được mã màu nào từ đoạn mã đã dán. Hãy đảm bảo định dạng màu chuẩn HEX hoặc RGB.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Search logic
	const filteredBrands = BRAND_DATABASE.filter((brand) =>
		brand.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Extract regex parsing logic
	const extractColorsFromCode = () => {
		// Match 6-char hex and 3-char hex values
		const hexRegex = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g;
		const matches = codeText.match(hexRegex);

		if (matches) {
			const unique = Array.from(new Set(matches.map((m) => m.toUpperCase())));
			setExtractedColors(unique);
		} else {
			setExtractedColors([]);
		}
	};

	const handleCopy = (hex: string) => {
		navigator.clipboard.writeText(hex);
		setCopiedColor(hex);
		setTimeout(() => setCopiedColor(null), 1500);
	};

	return (
		<div class="space-y-6">
			{/* Tab switches */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "brands"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("brands")}
				>
					{t.tabBrands}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "code"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("code")}
				>
					{t.tabCode}
				</button>
			</div>

			{/* Description */}
			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
				<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 mb-2">
					{t.title}
				</h3>
				<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
			</div>

			{mode === "brands" ? (
				<div class="space-y-4">
					{/* Search Field */}
					<input
						type="text"
						class="input w-full"
						placeholder={t.lblSearch}
						value={searchQuery}
						onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
					/>

					{/* Brands grid */}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredBrands.map((brand, idx) => (
							<div
								key={idx}
								class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3"
							>
								<span class="text-body-strong text-ink font-bold block border-b border-hairline pb-2">
									{brand.name}
								</span>
								<div class="grid grid-cols-2 gap-2">
									{brand.colors.map((color, cIdx) => (
										<button
											key={cIdx}
											class="flex items-center gap-2 bg-surface-soft p-1.5 rounded border border-hairline hover:border-primary transition-all text-left w-full cursor-pointer focus:outline-none"
											onClick={() => handleCopy(color.hex)}
										>
											<div
												class="w-8 h-8 rounded border border-hairline shrink-0 shadow-sm"
												style={{ backgroundColor: color.hex }}
											/>
											<div class="truncate">
												<span class="text-[10px] text-muted block truncate">{color.name}</span>
												<span class="text-[11px] font-mono font-bold text-ink uppercase truncate">
													{copiedColor === color.hex ? t.copied : color.hex}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Paste Panel */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="space-y-1.5">
							<label class="text-body-sm-strong text-ink block">{t.lblPaste}</label>
							<textarea
								class="input w-full h-80 font-mono text-xs"
								placeholder={t.placeholder}
								value={codeText}
								onInput={(e) => setCodeText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>
						<button class="btn-primary w-full py-2.5" onClick={extractColorsFromCode}>
							{t.btnExtract}
						</button>
					</div>

					{/* Extracted Swatches */}
					<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblExtracted}
						</h3>

						{extractedColors.length === 0 ? (
							<div class="text-center py-12 text-muted text-body-sm italic">{t.emptyExtract}</div>
						) : (
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
								{extractedColors.map((hex, idx) => (
									<button
										key={idx}
										class="flex items-center gap-3 bg-surface-soft p-2 rounded-lg border border-hairline hover:border-primary transition-all text-left w-full cursor-pointer focus:outline-none"
										onClick={() => handleCopy(hex)}
									>
										<div
											class="w-10 h-10 rounded border border-hairline shrink-0 shadow-sm"
											style={{ backgroundColor: hex }}
										/>
										<div class="truncate">
											<span class="text-body-xs font-mono font-bold text-ink uppercase">{hex}</span>
											<span class="text-[9px] text-muted block">
												{copiedColor === hex ? t.copied : t.copy}
											</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
