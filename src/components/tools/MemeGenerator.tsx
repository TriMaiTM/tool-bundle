import { useEffect, useRef, useState } from "preact/hooks";

interface MemeTemplate {
	id: string;
	nameEn: string;
	nameVi: string;
	type: "emoji" | "gradient" | "custom" | "solid";
	emoji?: string;
	bgColor?: string;
	bgGradient?: [string, string];
}

interface CustomText {
	id: string;
	text: string;
	x: number; // 0 to 100 percentage
	y: number; // 0 to 100 percentage
	size: number;
	color: string;
}

const MEME_TEMPLATES: MemeTemplate[] = [
	{
		id: "classic-dark",
		nameEn: "Classic Dark",
		nameVi: "Nền tối cổ điển",
		type: "solid",
		bgColor: "#1a1a1a",
	},
	{
		id: "doge-emoji",
		nameEn: "Doge (Emoji 🐕)",
		nameVi: "Meme Chó Doge 🐕",
		type: "emoji",
		emoji: "🐕",
		bgColor: "#f3e1b9",
	},
	{
		id: "cat-emoji",
		nameEn: "Grumpy Cat (Emoji 😾)",
		nameVi: "Mèo Khó Ở 😾",
		type: "emoji",
		emoji: "😾",
		bgColor: "#e2e8f0",
	},
	{
		id: "versus-battle",
		nameEn: "Versus Battle (VS)",
		nameVi: "So Tài (VS)",
		type: "custom",
		bgColor: "#000000",
	},
	{
		id: "sunset-gradient",
		nameEn: "Sunset Dream",
		nameVi: "Gradient Hoàng Hôn",
		type: "gradient",
		bgGradient: ["#f97316", "#ec4899"],
	},
	{
		id: "neon-gradient",
		nameEn: "Cyber Neon",
		nameVi: "Gradient Neon",
		type: "gradient",
		bgGradient: ["#06b6d4", "#8b5cf6"],
	},
];

export default function MemeGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// State
	const [selectedTemplate, setSelectedTemplate] = useState<string>("doge-emoji");
	const [customImage, setCustomImage] = useState<string | null>(null);
	const [topText, setTopText] = useState("");
	const [bottomText, setBottomText] = useState("");
	const [fontSize, setFontSize] = useState(36);
	const [fontColor, setFontColor] = useState("#ffffff");
	const [fontFamily, setFontFamily] = useState("Impact");
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [strokeWidth, setStrokeWidth] = useState(5);

	const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
	const [newText, setNewText] = useState("");
	const [activeTextId, setActiveTextId] = useState<string | null>(null);

	// Multi-language strings
	const t = {
		en: {
			template: "Choose Template",
			upload: "Upload Custom Image",
			topText: "Top Text",
			bottomText: "Bottom Text",
			fontSize: "Font Size",
			fontColor: "Font Color",
			fontFamily: "Font Family",
			strokeColor: "Border Color",
			strokeWidth: "Border Width",
			customTexts: "Additional Texts",
			addText: "Add Text",
			addTextPlaceholder: "Enter custom text...",
			download: "Download Meme",
			clear: "Clear All",
			moveTextTip: "Use sliders below to adjust text positions.",
			xPos: "X Position",
			yPos: "Y Position",
			deleteText: "Delete",
			selectToEdit: "Select additional text to edit:",
			none: "None Selected",
		},
		vi: {
			template: "Chọn mẫu ảnh nền",
			upload: "Tải ảnh từ máy tính",
			topText: "Chữ phía trên",
			bottomText: "Chữ phía dưới",
			fontSize: "Cỡ chữ",
			fontColor: "Màu chữ",
			fontFamily: "Phông chữ",
			strokeColor: "Màu viền chữ",
			strokeWidth: "Độ dày viền",
			customTexts: "Chữ bổ sung tự do",
			addText: "Thêm chữ",
			addTextPlaceholder: "Nhập thêm chữ...",
			download: "Tải ảnh Meme về",
			clear: "Xóa hết",
			moveTextTip: "Sử dụng các thanh trượt bên dưới để di chuyển chữ.",
			xPos: "Vị trí X",
			yPos: "Vị trí Y",
			deleteText: "Xóa chữ",
			selectToEdit: "Chọn chữ bổ sung để chỉnh sửa:",
			none: "Chưa chọn chữ nào",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Handle custom image upload
	const handleImageUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			const reader = new FileReader();
			reader.onload = (event) => {
				if (event.target?.result) {
					setCustomImage(event.target.result as string);
					setSelectedTemplate("custom");
				}
			};
			reader.readAsDataURL(target.files[0]);
		}
	};

	// Draw Canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const drawMeme = () => {
			const width = 500;
			const height = 500;
			canvas.width = width;
			canvas.height = height;

			// 1. Draw Background
			if (selectedTemplate === "custom" && customImage) {
				const img = new Image();
				img.src = customImage;
				img.onload = () => {
					// Draw image fitting the canvas aspect ratio
					ctx.drawImage(img, 0, 0, width, height);
					drawTexts(ctx, width, height);
				};
				return;
			}

			const tmpl = MEME_TEMPLATES.find((t) => t.id === selectedTemplate);
			if (tmpl) {
				if (tmpl.type === "solid" && tmpl.bgColor) {
					ctx.fillStyle = tmpl.bgColor;
					ctx.fillRect(0, 0, width, height);
				} else if (tmpl.type === "gradient" && tmpl.bgGradient) {
					const gradient = ctx.createLinearGradient(0, 0, width, height);
					gradient.addColorStop(0, tmpl.bgGradient[0]);
					gradient.addColorStop(1, tmpl.bgGradient[1]);
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, width, height);
				} else if (tmpl.type === "emoji" && tmpl.emoji) {
					ctx.fillStyle = tmpl.bgColor || "#ffffff";
					ctx.fillRect(0, 0, width, height);
					ctx.font = "180px Arial";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(tmpl.emoji, width / 2, height / 2);
				} else if (tmpl.id === "versus-battle") {
					// Red left, Blue right
					ctx.fillStyle = "#dc2626";
					ctx.fillRect(0, 0, width / 2, height);
					ctx.fillStyle = "#2563eb";
					ctx.fillRect(width / 2, 0, width / 2, height);

					// Draw VS circle
					ctx.fillStyle = "#ffffff";
					ctx.beginPath();
					ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
					ctx.fill();

					ctx.fillStyle = "#000000";
					ctx.font = "bold 48px Impact";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText("VS", width / 2, height / 2);
				}
			}

			drawTexts(ctx, width, height);
		};

		const drawTexts = (context: CanvasRenderingContext2D, w: number, h: number) => {
			// Helper to configure text style
			const setupTextStyle = (size: number, color: string) => {
				context.font = `bold ${size}px ${fontFamily}, sans-serif`;
				context.fillStyle = color;
				context.strokeStyle = strokeColor;
				context.lineWidth = strokeWidth;
				context.textAlign = "center";
				context.lineJoin = "round";
			};

			// Draw Top Text
			if (topText.trim()) {
				setupTextStyle(fontSize, fontColor);
				context.textBaseline = "top";
				const lines = topText.toUpperCase().split("\n");
				lines.forEach((line, idx) => {
					const yPos = 30 + idx * (fontSize + 10);
					if (strokeWidth > 0) {
						context.strokeText(line, w / 2, yPos);
					}
					context.fillText(line, w / 2, yPos);
				});
			}

			// Draw Bottom Text
			if (bottomText.trim()) {
				setupTextStyle(fontSize, fontColor);
				context.textBaseline = "bottom";
				const lines = bottomText.toUpperCase().split("\n");
				lines.reverse().forEach((line, idx) => {
					const yPos = h - 30 - idx * (fontSize + 10);
					if (strokeWidth > 0) {
						context.strokeText(line, w / 2, yPos);
					}
					context.fillText(line, w / 2, yPos);
				});
			}

			// Draw Custom Free-floating Texts
			customTexts.forEach((ct) => {
				setupTextStyle(ct.size, ct.color);
				context.textBaseline = "middle";
				const xPos = (ct.x / 100) * w;
				const yPos = (ct.y / 100) * h;

				// Draw active selection indicator ring on canvas for visual editor
				if (ct.id === activeTextId) {
					context.save();
					context.strokeStyle = "#e60023";
					context.lineWidth = 2;
					context.setLineDash([6, 4]);
					context.strokeRect(xPos - 120, yPos - ct.size / 2 - 6, 240, ct.size + 12);
					context.restore();
				}

				if (strokeWidth > 0) {
					context.strokeText(ct.text, xPos, yPos);
				}
				context.fillText(ct.text, xPos, yPos);
			});
		};

		drawMeme();
	}, [
		selectedTemplate,
		customImage,
		topText,
		bottomText,
		fontSize,
		fontColor,
		fontFamily,
		strokeColor,
		strokeWidth,
		customTexts,
		activeTextId,
	]);

	// Download handler
	const downloadMeme = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = `toolbundle-meme-${Date.now()}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	};

	// Add new floating text block
	const addCustomText = () => {
		if (!newText.trim()) return;
		const newBlock: CustomText = {
			id: Math.random().toString(36).substring(2, 9),
			text: newText.trim(),
			x: 50,
			y: 50,
			size: 28,
			color: "#ffffff",
		};
		setCustomTexts([...customTexts, newBlock]);
		setActiveTextId(newBlock.id);
		setNewText("");
	};

	// Update individual floating text parameters
	const updateActiveText = (key: keyof CustomText, value: any) => {
		if (!activeTextId) return;
		setCustomTexts(
			customTexts.map((ct) => (ct.id === activeTextId ? { ...ct, [key]: value } : ct)),
		);
	};

	// Delete selected custom text
	const deleteActiveText = () => {
		if (!activeTextId) return;
		setCustomTexts(customTexts.filter((ct) => ct.id !== activeTextId));
		setActiveTextId(null);
	};

	const activeText = customTexts.find((ct) => ct.id === activeTextId);

	return (
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			{/* Canvas Preview Column */}
			<div class="lg:col-span-6 flex flex-col items-center">
				<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm w-full flex justify-center items-center overflow-hidden">
					<canvas
						ref={canvasRef}
						class="w-full max-w-[450px] aspect-square bg-stone rounded border border-hairline"
						style="touch-action: none;"
					/>
				</div>
				<p class="text-caption text-muted mt-3 text-center w-full">{t.moveTextTip}</p>
				<button
					class="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
					onClick={downloadMeme}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					{t.download}
				</button>
			</div>

			{/* Control Panel Column */}
			<div class="lg:col-span-6 space-y-6">
				{/* 1. Template & Upload */}
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline space-y-4 shadow-sm">
					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.template}</label>
						<select
							class="select w-full"
							value={selectedTemplate}
							onChange={(e) => {
								setSelectedTemplate((e.target as HTMLSelectElement).value);
								if ((e.target as HTMLSelectElement).value !== "custom") {
									setCustomImage(null);
								}
							}}
						>
							{MEME_TEMPLATES.map((tmpl) => (
								<option value={tmpl.id}>{lang === "vi" ? tmpl.nameVi : tmpl.nameEn}</option>
							))}
							{customImage && (
								<option value="custom">
									{lang === "vi" ? "Ảnh đã tải lên" : "Uploaded Image"}
								</option>
							)}
						</select>
					</div>

					<div>
						<label class="text-body-sm-strong text-ink block mb-2">{t.upload}</label>
						<input
							type="file"
							ref={fileInputRef}
							class="hidden"
							accept="image/*"
							onChange={handleImageUpload}
						/>
						<button
							class="btn-secondary w-full flex items-center justify-center gap-2"
							onClick={() => fileInputRef.current?.click()}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17 8 12 3 7 8" />
								<line x1="12" y1="3" x2="12" y2="15" />
							</svg>
							{t.upload}
						</button>
					</div>
				</div>

				{/* 2. Text Input */}
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline space-y-4 shadow-sm">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="text-body-sm-strong text-ink block mb-1">{t.topText}</label>
							<textarea
								class="textarea w-full text-body-sm"
								rows={2}
								placeholder="TOP OF THE MEME"
								value={topText}
								onInput={(e) => setTopText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>
						<div>
							<label class="text-body-sm-strong text-ink block mb-1">{t.bottomText}</label>
							<textarea
								class="textarea w-full text-body-sm"
								rows={2}
								placeholder="BOTTOM OF THE MEME"
								value={bottomText}
								onInput={(e) => setBottomText((e.target as HTMLTextAreaElement).value)}
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
						<div>
							<label class="text-caption text-muted block mb-1">
								{t.fontSize} ({fontSize}px)
							</label>
							<input
								type="range"
								min="16"
								max="72"
								class="w-full accent-primary"
								value={fontSize}
								onInput={(e) => setFontSize(Number.parseInt((e.target as HTMLInputElement).value))}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">
								{t.strokeWidth} ({strokeWidth}px)
							</label>
							<input
								type="range"
								min="0"
								max="15"
								class="w-full accent-primary"
								value={strokeWidth}
								onInput={(e) =>
									setStrokeWidth(Number.parseInt((e.target as HTMLInputElement).value))
								}
							/>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">{t.fontFamily}</label>
							<select
								class="select w-full py-1 text-xs"
								value={fontFamily}
								onChange={(e) => setFontFamily((e.target as HTMLSelectElement).value)}
							>
								<option value="Impact">Impact</option>
								<option value="Arial">Arial</option>
								<option value="Courier New">Courier</option>
								<option value="Times New Roman">Times</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-caption text-muted block mb-1">{t.fontColor}</label>
							<div class="flex gap-2 items-center">
								<input
									type="color"
									class="w-8 h-8 rounded border border-hairline cursor-pointer"
									value={fontColor}
									onInput={(e) => setFontColor((e.target as HTMLInputElement).value)}
								/>
								<span class="text-xs uppercase font-mono">{fontColor}</span>
							</div>
						</div>
						<div>
							<label class="text-caption text-muted block mb-1">{t.strokeColor}</label>
							<div class="flex gap-2 items-center">
								<input
									type="color"
									class="w-8 h-8 rounded border border-hairline cursor-pointer"
									value={strokeColor}
									onInput={(e) => setStrokeColor((e.target as HTMLInputElement).value)}
								/>
								<span class="text-xs uppercase font-mono">{strokeColor}</span>
							</div>
						</div>
					</div>
				</div>

				{/* 3. Floating Custom Texts */}
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline space-y-4 shadow-sm">
					<h3 class="text-body-sm-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
							<path d="m15 5 4 4" />
						</svg>
						{t.customTexts}
					</h3>

					{/* Add text form */}
					<div class="flex gap-2">
						<input
							type="text"
							class="input flex-1 text-body-sm"
							placeholder={t.addTextPlaceholder}
							value={newText}
							onInput={(e) => setNewText((e.target as HTMLInputElement).value)}
							onKeyDown={(e) => e.key === "Enter" && addCustomText()}
						/>
						<button class="btn-primary text-xs" onClick={addCustomText}>
							{t.addText}
						</button>
					</div>

					{/* Custom texts list select */}
					{customTexts.length > 0 && (
						<div class="space-y-3 pt-2">
							<div>
								<label class="text-caption text-muted block mb-1">{t.selectToEdit}</label>
								<select
									class="select w-full py-1 text-xs"
									value={activeTextId || ""}
									onChange={(e) => setActiveTextId((e.target as HTMLSelectElement).value || null)}
								>
									<option value="">-- {t.none} --</option>
									{customTexts.map((ct) => (
										<option value={ct.id}>"{ct.text.substring(0, 20)}"</option>
									))}
								</select>
							</div>

							{activeText && (
								<div class="bg-surface-soft p-3 rounded-lg border border-hairline space-y-3">
									<div class="grid grid-cols-2 gap-3">
										<div>
											<label class="text-xs text-muted block mb-1">
												{t.xPos} ({activeText.x}%)
											</label>
											<input
												type="range"
												min="0"
												max="100"
												class="w-full accent-primary"
												value={activeText.x}
												onInput={(e) =>
													updateActiveText(
														"x",
														Number.parseInt((e.target as HTMLInputElement).value),
													)
												}
											/>
										</div>
										<div>
											<label class="text-xs text-muted block mb-1">
												{t.yPos} ({activeText.y}%)
											</label>
											<input
												type="range"
												min="0"
												max="100"
												class="w-full accent-primary"
												value={activeText.y}
												onInput={(e) =>
													updateActiveText(
														"y",
														Number.parseInt((e.target as HTMLInputElement).value),
													)
												}
											/>
										</div>
									</div>

									<div class="grid grid-cols-2 gap-3 items-end">
										<div>
											<label class="text-xs text-muted block mb-1">
												{t.fontSize} ({activeText.size}px)
											</label>
											<input
												type="range"
												min="10"
												max="60"
												class="w-full accent-primary"
												value={activeText.size}
												onInput={(e) =>
													updateActiveText(
														"size",
														Number.parseInt((e.target as HTMLInputElement).value),
													)
												}
											/>
										</div>
										<div class="flex gap-2 justify-between items-center">
											<div>
												<label class="text-xs text-muted block mb-1">{t.fontColor}</label>
												<input
													type="color"
													class="w-8 h-8 rounded border border-hairline cursor-pointer"
													value={activeText.color}
													onInput={(e) =>
														updateActiveText("color", (e.target as HTMLInputElement).value)
													}
												/>
											</div>
											<button
												class="btn-secondary text-xs text-error font-semibold flex-1 mt-3"
												onClick={deleteActiveText}
											>
												{t.deleteText}
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
