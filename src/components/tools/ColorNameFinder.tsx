import { useEffect, useState } from "preact/hooks";

interface ColorItem {
	name: string;
	nameVi: string;
	hex: string;
}

const COLOR_DATABASE: ColorItem[] = [
	{ name: "Black", nameVi: "Màu Đen", hex: "#000000" },
	{ name: "White", nameVi: "Màu Trắng", hex: "#FFFFFF" },
	{ name: "Red", nameVi: "Màu Đỏ", hex: "#FF0000" },
	{ name: "Lime", nameVi: "Màu Xanh Chanh", hex: "#00FF00" },
	{ name: "Blue", nameVi: "Màu Xanh Lam", hex: "#0000FF" },
	{ name: "Yellow", nameVi: "Màu Vàng", hex: "#FFFF00" },
	{ name: "Cyan", nameVi: "Màu Xanh Lơ", hex: "#00FFFF" },
	{ name: "Magenta", nameVi: "Màu Đỏ Magenta", hex: "#FF00FF" },
	{ name: "Silver", nameVi: "Màu Bạc", hex: "#C0C0C0" },
	{ name: "Gray", nameVi: "Màu Xám", hex: "#808080" },
	{ name: "Maroon", nameVi: "Màu Hạt Dẻ", hex: "#800000" },
	{ name: "Olive", nameVi: "Màu Xanh Ô-liu", hex: "#808000" },
	{ name: "Green", nameVi: "Màu Xanh Lục", hex: "#008000" },
	{ name: "Purple", nameVi: "Màu Tím", hex: "#800080" },
	{ name: "Teal", nameVi: "Màu Xanh Mòng Két", hex: "#008080" },
	{ name: "Navy", nameVi: "Màu Xanh Hải Quân", hex: "#000080" },
	{ name: "Orange", nameVi: "Màu Cam", hex: "#FFA500" },
	{ name: "Brown", nameVi: "Màu Nâu", hex: "#A52A2A" },
	{ name: "Pink", nameVi: "Màu Hồng", hex: "#FFC0CB" },
	{ name: "Gold", nameVi: "Màu Vàng Gold", hex: "#FFD700" },
	{ name: "Beige", nameVi: "Màu Be", hex: "#F5F5DC" },
	{ name: "Chocolate", nameVi: "Màu Sô-cô-la", hex: "#D2691E" },
	{ name: "Crimson", nameVi: "Màu Đỏ Crimson", hex: "#DC143C" },
	{ name: "Deep Pink", nameVi: "Màu Hồng Đậm", hex: "#FF1493" },
	{ name: "Forest Green", nameVi: "Màu Xanh Rừng Rậm", hex: "#228B22" },
	{ name: "Hot Pink", nameVi: "Màu Hồng Rực", hex: "#FF69B4" },
	{ name: "Indigo", nameVi: "Màu Xanh Chàm", hex: "#4B0082" },
	{ name: "Ivory", nameVi: "Màu Ngà", hex: "#FFFFF0" },
	{ name: "Khaki", nameVi: "Màu Kaki", hex: "#F0E68C" },
	{ name: "Lavender", nameVi: "Màu Oải Hương", hex: "#E6E6FA" },
	{ name: "Mint / Aquamarine", nameVi: "Màu Ngọc Xanh Biển", hex: "#7FFFD4" },
	{ name: "Coral", nameVi: "Màu San Hô", hex: "#FF7F50" },
	{ name: "Orchid", nameVi: "Màu Hoa Lan", hex: "#DA70D6" },
	{ name: "Plum", nameVi: "Màu Mận", hex: "#DDA0DD" },
	{ name: "Salmon", nameVi: "Màu Hồng Cá Hồi", hex: "#FA8072" },
	{ name: "Sky Blue", nameVi: "Màu Xanh Da Trời", hex: "#87CEEB" },
	{ name: "Slate Gray", nameVi: "Màu Xám Đá Slate", hex: "#708090" },
	{ name: "Snow", nameVi: "Màu Trắng Tuyết", hex: "#FFFAFA" },
	{ name: "Tan", nameVi: "Màu Rám Nắng", hex: "#D2B48C" },
	{ name: "Tomato", nameVi: "Màu Đỏ Cà Chua", hex: "#FF6347" },
	{ name: "Turquoise", nameVi: "Màu Ngọc Lam", hex: "#40E0D0" },
	{ name: "Violet", nameVi: "Màu Tím Violet", hex: "#EE82EE" },
	{ name: "Wheat", nameVi: "Màu Lúa Mì", hex: "#F5DEB3" },
];

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	const r = Number.parseInt(clean.substring(0, 2), 16) || 0;
	const g = Number.parseInt(clean.substring(2, 4), 16) || 0;
	const b = Number.parseInt(clean.substring(4, 6), 16) || 0;
	return [r, g, b];
}

// 3D Euclidean Color Distance
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
	return Math.sqrt((rgb1[0] - rgb2[0]) ** 2 + (rgb1[1] - rgb2[1]) ** 2 + (rgb1[2] - rgb2[2]) ** 2);
}

export default function ColorNameFinder() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [colorInput, setColorInput] = useState("#FF5733");
	const [closestColor, setClosestColor] = useState<ColorItem | null>(null);
	const [nearbyColors, setNearbyColors] = useState<{ color: ColorItem; distance: number }[]>([]);
	const [copiedColor, setCopiedColor] = useState<string | null>(null);

	const t = {
		en: {
			title: "Color Name Finder",
			desc: "Pick or enter any color value to instantly match and retrieve its closest standard human-readable color name.",
			lblInput: "Pick / Enter Color",
			lblMatched: "Closest Color Matched",
			lblNearby: "Nearby Named Colors",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Tìm tên màu sắc",
			desc: "Chọn hoặc nhập mã màu bất kỳ để so khớp và tìm ra tên gọi màu sắc gần nhất bằng tiếng Anh và tiếng Việt.",
			lblInput: "Chọn / Nhập mã màu",
			lblMatched: "Tên màu khớp nhất",
			lblNearby: "Các màu sắc gần nhất",
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

	// Run matching whenever color input updates
	useEffect(() => {
		if (!/^#[0-9A-F]{6}$/i.test(colorInput)) return;

		const targetRgb = hexToRgb(colorInput);

		const mapped = COLOR_DATABASE.map((item) => {
			const dbRgb = hexToRgb(item.hex);
			return {
				color: item,
				distance: colorDistance(targetRgb, dbRgb),
			};
		});

		// Sort by distance (smaller means closer match)
		mapped.sort((a, b) => a.distance - b.distance);

		setClosestColor(mapped[0].color);
		setNearbyColors(mapped.slice(0, 5));
	}, [colorInput]);

	const handleCopy = (hex: string) => {
		navigator.clipboard.writeText(hex);
		setCopiedColor(hex);
		setTimeout(() => setCopiedColor(null), 1500);
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

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<div class="flex gap-2">
							<input
								type="color"
								class="w-10 h-10 border border-hairline rounded cursor-pointer shrink-0"
								value={colorInput}
								onInput={(e) => setColorInput((e.target as HTMLInputElement).value)}
							/>
							<input
								type="text"
								class="input w-full font-mono text-body-sm"
								value={colorInput}
								onInput={(e) => setColorInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Closest Match card */}
					{closestColor && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
							<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblMatched}
							</h4>
							<div class="flex flex-col sm:flex-row items-center gap-6">
								<div
									class="w-20 h-20 rounded-lg border border-hairline shadow-sm shrink-0"
									style={{ backgroundColor: closestColor.hex }}
								/>
								<div class="space-y-1 w-full">
									<div class="text-lg font-bold text-ink">
										{lang === "en" ? closestColor.name : closestColor.nameVi}
									</div>
									<div class="text-body-xs text-muted">
										HEX: <span class="font-mono">{closestColor.hex}</span>
									</div>
									<div class="text-body-xs text-muted">
										RGB: <span class="font-mono">{hexToRgb(closestColor.hex).join(", ")}</span>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Nearby colors list */}
					{nearbyColors.length > 0 && (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
								{t.lblNearby}
							</h3>
							<div class="space-y-2">
								{nearbyColors.map((item, idx) => (
									<div
										key={idx}
										class="flex items-center justify-between bg-surface-soft p-2.5 rounded-lg border border-hairline hover:border-primary/30 transition-colors"
									>
										<div class="flex items-center gap-3">
											<div
												class="w-8 h-8 rounded border border-hairline shrink-0 shadow-xs"
												style={{ backgroundColor: item.color.hex }}
											/>
											<div>
												<span class="text-body-sm-strong text-ink font-bold block">
													{lang === "en" ? item.color.name : item.color.nameVi}
												</span>
												<span class="text-body-xs text-muted font-mono">{item.color.hex}</span>
											</div>
										</div>

										<button
											class="btn-secondary text-[10px] py-1.5 px-3"
											onClick={() => handleCopy(item.color.hex)}
										>
											{copiedColor === item.color.hex ? t.copied : t.copy}
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
