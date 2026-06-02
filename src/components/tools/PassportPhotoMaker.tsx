import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type PresetKey = "vn-34" | "vn-46" | "us-22";

interface PresetInfo {
	width: number; // in pixels at 300 DPI
	height: number;
	labelEn: string;
	labelVi: string;
	mmSize: string;
}

const PRESETS: Record<PresetKey, PresetInfo> = {
	"vn-34": {
		width: 354, // 30mm / 25.4 * 300 = 354.3
		height: 472, // 40mm / 25.4 * 300 = 472.4
		labelEn: "Vietnam ID / Student Card (3x4 cm)",
		labelVi: "Ảnh thẻ Việt Nam (3x4 cm)",
		mmSize: "30x40 mm",
	},
	"vn-46": {
		width: 472, // 40mm / 25.4 * 300 = 472.4
		height: 709, // 60mm / 25.4 * 300 = 708.6
		labelEn: "Vietnam Passport / Visa (4x6 cm)",
		labelVi: "Hộ chiếu / Visa Việt Nam (4x6 cm)",
		mmSize: "40x60 mm",
	},
	"us-22": {
		width: 600, // 2 inches * 300 = 600
		height: 600, // 2 inches * 300 = 600
		labelEn: "US Passport / Visa (2x2 inch)",
		labelVi: "Ảnh hộ chiếu Mỹ (2x2 inch)",
		mmSize: "51x51 mm",
	},
};

type SheetKey = "a4" | "4x6";

interface SheetInfo {
	width: number;
	height: number;
	labelEn: string;
	labelVi: string;
}

const SHEETS: Record<SheetKey, SheetInfo> = {
	a4: {
		width: 2480, // A4 at 300 DPI
		height: 3508,
		labelEn: "A4 Paper Sheet (21x29.7 cm)",
		labelVi: "Khổ giấy A4 (21x29.7 cm)",
	},
	"4x6": {
		width: 1200, // 4x6 inches at 300 DPI
		height: 1800,
		labelEn: "Photo Paper 4x6 inch (10x15 cm)",
		labelVi: "Khổ ảnh 4x6 inch (10x15 cm)",
	},
};

export default function PassportPhotoMaker() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sheetCanvasRef = useRef<HTMLCanvasElement>(null);

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
	const [imgNaturalHeight, setImgNaturalHeight] = useState(0);

	// Configuration
	const [preset, setPreset] = useState<PresetKey>("vn-34");
	const [bgColorType, setBgColorType] = useState<"original" | "white" | "blue" | "custom">("white");
	const [customBgColor, setCustomBgColor] = useState("#ffffff");
	const [sheetSize, setSheetSize] = useState<SheetKey>("a4");

	// Chroma Key / Replacement
	const [replaceBg, setReplaceBg] = useState(false);
	const [keyColor, setKeyColor] = useState("#ffffff");
	const [tolerance, setTolerance] = useState(30);
	const [feather, setFeather] = useState(10);

	// Transform adjustments
	const [scale, setScale] = useState(1.0);
	const [offsetX, setOffsetX] = useState(0);
	const [offsetY, setOffsetY] = useState(0);
	const [rotate, setRotate] = useState(0);

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [singlePhotoUrl, setSinglePhotoUrl] = useState<string | null>(null);
	const [printSheetUrl, setPrintSheetUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Passport Photo Maker",
			presetLabel: "Passport Photo Size",
			bgColorLabel: "Background Color",
			bgOriginal: "Original",
			bgWhite: "White (Standard)",
			bgBlue: "Blue (Vietnam Standard)",
			bgCustom: "Custom Color",
			replaceBgCheck: "Enable Background Replacement",
			keyColorLabel: "Source background color to remove",
			toleranceLabel: "Color tolerance",
			featherLabel: "Feather edges",
			scaleLabel: "Scale (Zoom)",
			positionX: "Position X",
			positionY: "Position Y",
			rotation: "Rotation",
			sheetLabel: "Print Sheet Size",
			processBtn: "Generate Photos",
			downloadSingle: "Download Single Photo",
			downloadSheet: "Download Print Sheet",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to make passport photos",
			dropzoneSub: "Supports JPG, PNG, WebP",
			previewTitle: "Single Photo Preview",
			sheetPreviewTitle: "Print Sheet Preview (Grid)",
			colorPickerTip:
				"Click on the preview photo to select the background color you want to replace.",
		},
		vi: {
			title: "Tạo ảnh thẻ & ảnh hộ chiếu",
			presetLabel: "Kích thước ảnh thẻ",
			bgColorLabel: "Màu nền ảnh thẻ",
			bgOriginal: "Giữ gốc",
			bgWhite: "Màu trắng (Chuẩn)",
			bgBlue: "Màu xanh (Chuẩn Việt Nam)",
			bgCustom: "Màu tự chọn",
			replaceBgCheck: "Bật tách/thay thế nền",
			keyColorLabel: "Màu nền gốc cần xóa",
			toleranceLabel: "Độ lệch màu (Tolerance)",
			featherLabel: "Làm mềm viền (Feather)",
			scaleLabel: "Phóng to/Thu nhỏ",
			positionX: "Dịch chuyển ngang (X)",
			positionY: "Dịch chuyển dọc (Y)",
			rotation: "Góc xoay",
			sheetLabel: "Khổ giấy in lưới",
			processBtn: "Tạo ảnh thẻ",
			downloadSingle: "Tải 1 ảnh thẻ đơn",
			downloadSheet: "Tải tấm ảnh ghép in (A4/4x6)",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh chân dung vào đây để tạo ảnh thẻ",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP",
			previewTitle: "Xem trước ảnh thẻ đơn",
			sheetPreviewTitle: "Xem trước tấm ảnh ghép in lưới",
			colorPickerTip: "Click vào ảnh xem trước để chọn màu nền cũ bạn muốn lọc bỏ.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Cleanup URLs
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (singlePhotoUrl) URL.revokeObjectURL(singlePhotoUrl);
			if (printSheetUrl) URL.revokeObjectURL(printSheetUrl);
		};
	}, [previewUrl, singlePhotoUrl, printSheetUrl]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (singlePhotoUrl) URL.revokeObjectURL(singlePhotoUrl);
			if (printSheetUrl) URL.revokeObjectURL(printSheetUrl);

			setFile(f);
			setSinglePhotoUrl(null);
			setPrintSheetUrl(null);
			setStatus("idle");

			const url = URL.createObjectURL(f);
			setPreviewUrl(url);

			const tempImg = new Image();
			tempImg.onload = () => {
				setImgNaturalWidth(tempImg.naturalWidth);
				setImgNaturalHeight(tempImg.naturalHeight);
				// Auto set initial scale so image fits passport bounds nicely
				const selectedPreset = PRESETS[preset];
				const scaleW = selectedPreset.width / tempImg.naturalWidth;
				const scaleH = selectedPreset.height / tempImg.naturalHeight;
				setScale(Math.max(scaleW, scaleH) * 1.1);
				setOffsetX(0);
				setOffsetY(0);
				setRotate(0);
			};
			tempImg.src = url;
		},
		[previewUrl, singlePhotoUrl, printSheetUrl, preset],
	);

	// Convert Hex to RGB
	const hexToRgb = (hex: string) => {
		hex = hex.replace("#", "");
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((c) => c + c)
				.join("");
		}
		const r = Number.parseInt(hex.substring(0, 2), 16) || 0;
		const g = Number.parseInt(hex.substring(2, 4), 16) || 0;
		const b = Number.parseInt(hex.substring(4, 6), 16) || 0;
		return { r, g, b };
	};

	// Draw and process single passport photo
	const renderPassportCanvas = (img: HTMLImageElement): HTMLCanvasElement | null => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		const currentPreset = PRESETS[preset];
		canvas.width = currentPreset.width;
		canvas.height = currentPreset.height;

		// Set target background color
		let targetColor = "transparent";
		if (bgColorType === "white") targetColor = "#ffffff";
		else if (bgColorType === "blue") targetColor = "#004b91";
		else if (bgColorType === "custom") targetColor = customBgColor;

		// Clear canvas
		ctx.fillStyle = targetColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// If background replacement is enabled, generate processed image with transparency
		let srcCanvas: HTMLCanvasElement | HTMLImageElement = img;
		if (replaceBg && bgColorType !== "original") {
			const key = hexToRgb(keyColor);
			const procCanvas = document.createElement("canvas");
			procCanvas.width = img.naturalWidth;
			procCanvas.height = img.naturalHeight;
			const pCtx = procCanvas.getContext("2d");
			if (pCtx) {
				pCtx.drawImage(img, 0, 0);
				const imgData = pCtx.getImageData(0, 0, procCanvas.width, procCanvas.height);
				const data = imgData.data;
				for (let i = 0; i < data.length; i += 4) {
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const distance = Math.sqrt((r - key.r) ** 2 + (g - key.g) ** 2 + (b - key.b) ** 2);
					if (distance < tolerance) {
						let alphaFactor = 0;
						if (tolerance - feather > 0 && distance > tolerance - feather) {
							alphaFactor = (distance - (tolerance - feather)) / feather;
						}
						data[i + 3] = Math.round(255 * alphaFactor);
					}
				}
				pCtx.putImageData(imgData, 0, 0);
				srcCanvas = procCanvas;
			}
		}

		// Draw user photo with transforms
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.translate(offsetX, offsetY);
		ctx.rotate((rotate * Math.PI) / 180);
		ctx.scale(scale, scale);
		ctx.drawImage(srcCanvas, -img.naturalWidth / 2, -img.naturalHeight / 2);
		ctx.restore();

		return canvas;
	};

	// Generate print sheet
	const generatePrintSheet = (singleCanvas: HTMLCanvasElement) => {
		const sheetCanvas = sheetCanvasRef.current;
		if (!sheetCanvas) return;
		const ctx = sheetCanvas.getContext("2d");
		if (!ctx) return;

		const currentSheet = SHEETS[sheetSize];
		sheetCanvas.width = currentSheet.width;
		sheetCanvas.height = currentSheet.height;

		// White background
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

		const pw = singleCanvas.width;
		const ph = singleCanvas.height;

		// Calculate layouts
		const spacing = 40; // spacing between photos in pixels
		const marginX = 80;
		const marginY = 80;

		const colCount = Math.floor((sheetCanvas.width - marginX * 2 + spacing) / (pw + spacing));
		const rowCount = Math.floor((sheetCanvas.height - marginY * 2 + spacing) / (ph + spacing));

		// Center the grid on the sheet
		const totalWidth = colCount * pw + (colCount - 1) * spacing;
		const totalHeight = rowCount * ph + (rowCount - 1) * spacing;
		const startX = (sheetCanvas.width - totalWidth) / 2;
		const startY = (sheetCanvas.height - totalHeight) / 2;

		for (let r = 0; r < rowCount; r++) {
			for (let c = 0; c < colCount; c++) {
				const x = startX + c * (pw + spacing);
				const y = startY + r * (ph + spacing);

				// Draw photo
				ctx.drawImage(singleCanvas, x, y);

				// Draw light grey border guide (cut line)
				ctx.strokeStyle = "#dddddd";
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, pw, ph);
			}
		}
	};

	const processPhotos = () => {
		if (!previewUrl) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const singleCanvas = renderPassportCanvas(img);
					if (!singleCanvas) {
						setStatus("error");
						return;
					}

					// 1. Export single photo blob
					singleCanvas.toBlob((singleBlob) => {
						if (singleBlob) {
							if (singlePhotoUrl) URL.revokeObjectURL(singlePhotoUrl);
							const sUrl = URL.createObjectURL(singleBlob);
							setSinglePhotoUrl(sUrl);

							// 2. Export sheet photo blob
							generatePrintSheet(singleCanvas);
							const sheetCanvas = sheetCanvasRef.current;
							if (sheetCanvas) {
								sheetCanvas.toBlob(
									(sheetBlob) => {
										if (sheetBlob) {
											if (printSheetUrl) URL.revokeObjectURL(printSheetUrl);
											setPrintSheetUrl(URL.createObjectURL(sheetBlob));
											setStatus("done");
										} else {
											setStatus("error");
										}
									},
									"image/jpeg",
									0.95,
								);
							} else {
								setStatus("error");
							}
						} else {
							setStatus("error");
						}
					}, file?.type || "image/png");
				};
				img.onerror = () => setStatus("error");
				img.src = previewUrl;
			} catch (e) {
				console.error(e);
				setStatus("error");
			}
		}, 100);
	};

	// Live preview render loop as adjustments change
	useEffect(() => {
		if (!previewUrl || status === "processing") return;
		const img = new Image();
		img.onload = () => {
			renderPassportCanvas(img);
		};
		img.src = previewUrl;
	}, [
		previewUrl,
		preset,
		bgColorType,
		customBgColor,
		replaceBg,
		keyColor,
		tolerance,
		feather,
		scale,
		offsetX,
		offsetY,
		rotate,
	]);

	const handleDownloadSingle = () => {
		if (!singlePhotoUrl) return;
		const a = document.createElement("a");
		a.href = singlePhotoUrl;
		a.download = `passport-${preset}-${file?.name || "photo.png"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleDownloadSheet = () => {
		if (!printSheetUrl) return;
		const a = document.createElement("a");
		a.href = printSheetUrl;
		a.download = `printsheet-${sheetSize}-${file?.name || "photo.jpg"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (singlePhotoUrl) URL.revokeObjectURL(singlePhotoUrl);
		if (printSheetUrl) URL.revokeObjectURL(printSheetUrl);
		setFile(null);
		setPreviewUrl(null);
		setSinglePhotoUrl(null);
		setPrintSheetUrl(null);
		setStatus("idle");
	};

	const handleCanvasClick = (e: MouseEvent) => {
		if (!replaceBg) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const x = (e.clientX - rect.left) * scaleX;
		const y = (e.clientY - rect.top) * scaleY;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const pixel = ctx.getImageData(x, y, 1, 1).data;
		const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
		setKeyColor(hex);
	};

	return (
		<div class="space-y-6">
			{!file && (
				<FileDropZone
					accept="image/*"
					onFiles={handleFiles}
					label={t.dropzoneLabel}
					sublabel={t.dropzoneSub}
				/>
			)}

			{file && (
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left Panel: Configuration */}
					<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
						<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
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
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
								<path d="M16 3.13a4 4 0 0 1 0 7.75" />
							</svg>
							Passport Maker settings
						</h3>

						{/* Photo Size Preset */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.presetLabel}</label>
							<select
								class="input w-full"
								value={preset}
								onChange={(e) => setPreset((e.target as HTMLSelectElement).value as PresetKey)}
							>
								{Object.entries(PRESETS).map(([key, value]) => (
									<option key={key} value={key}>
										{lang === "vi" ? value.labelVi : value.labelEn} ({value.mmSize})
									</option>
								))}
							</select>
						</div>

						{/* Background Color selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.bgColorLabel}</label>
							<div class="grid grid-cols-2 gap-2 mb-3">
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										bgColorType === "white"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setBgColorType("white")}
								>
									{t.bgWhite}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										bgColorType === "blue"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setBgColorType("blue")}
								>
									{t.bgBlue}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										bgColorType === "original"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setBgColorType("original")}
								>
									{t.bgOriginal}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										bgColorType === "custom"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setBgColorType("custom")}
								>
									{t.bgCustom}
								</button>
							</div>

							{bgColorType === "custom" && (
								<div class="flex gap-2 items-center">
									<input
										type="color"
										class="w-10 h-10 rounded border border-hairline cursor-pointer"
										value={customBgColor}
										onInput={(e) => setCustomBgColor((e.target as HTMLInputElement).value)}
									/>
									<span class="text-body-sm uppercase font-mono">{customBgColor}</span>
								</div>
							)}
						</div>

						{/* Background replacement controls */}
						{bgColorType !== "original" && (
							<div class="space-y-4 bg-surface-soft p-4 rounded-lg border border-hairline">
								<label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
									<input
										type="checkbox"
										class="accent-primary"
										checked={replaceBg}
										onChange={(e) => setReplaceBg((e.target as HTMLInputElement).checked)}
									/>
									{t.replaceBgCheck}
								</label>

								{replaceBg && (
									<div class="space-y-3 pt-2 border-t border-hairline">
										<div>
											<label class="text-xs text-muted block mb-1">{t.keyColorLabel}</label>
											<div class="flex gap-2 items-center mb-1">
												<input
													type="color"
													class="w-8 h-8 rounded border border-hairline cursor-pointer"
													value={keyColor}
													onInput={(e) => setKeyColor((e.target as HTMLInputElement).value)}
												/>
												<span class="text-xs uppercase font-mono">{keyColor}</span>
											</div>
											<p class="text-caption text-muted">{t.colorPickerTip}</p>
										</div>

										<div>
											<label class="text-xs text-muted block mb-1">
												{t.toleranceLabel} ({tolerance})
											</label>
											<input
												type="range"
												min="5"
												max="150"
												class="w-full accent-primary"
												value={tolerance}
												onInput={(e) =>
													setTolerance(Number.parseInt((e.target as HTMLInputElement).value))
												}
											/>
										</div>

										<div>
											<label class="text-xs text-muted block mb-1">
												{t.featherLabel} ({feather}px)
											</label>
											<input
												type="range"
												min="0"
												max="50"
												class="w-full accent-primary"
												value={feather}
												onInput={(e) =>
													setFeather(Number.parseInt((e.target as HTMLInputElement).value))
												}
											/>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Manual Alignment controls */}
						<div class="space-y-4 bg-surface-soft p-4 rounded-lg border border-hairline">
							<h4 class="text-xs font-bold text-ink mb-2">Manual Crop & Align</h4>

							<div>
								<label class="text-xs text-muted block mb-1">
									{t.scaleLabel} ({Math.round(scale * 100)}%)
								</label>
								<input
									type="range"
									min="0.1"
									max="4.0"
									step="0.05"
									class="w-full accent-primary"
									value={scale}
									onInput={(e) => setScale(Number.parseFloat((e.target as HTMLInputElement).value))}
								/>
							</div>

							<div class="grid grid-cols-2 gap-2">
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.positionX} ({offsetX}px)
									</label>
									<input
										type="range"
										min="-300"
										max="300"
										class="w-full accent-primary"
										value={offsetX}
										onInput={(e) =>
											setOffsetX(Number.parseInt((e.target as HTMLInputElement).value))
										}
									/>
								</div>
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.positionY} ({offsetY}px)
									</label>
									<input
										type="range"
										min="-300"
										max="300"
										class="w-full accent-primary"
										value={offsetY}
										onInput={(e) =>
											setOffsetY(Number.parseInt((e.target as HTMLInputElement).value))
										}
									/>
								</div>
							</div>

							<div>
								<label class="text-xs text-muted block mb-1">
									{t.rotation} ({rotate}°)
								</label>
								<input
									type="range"
									min="-180"
									max="180"
									class="w-full accent-primary"
									value={rotate}
									onInput={(e) => setRotate(Number.parseInt((e.target as HTMLInputElement).value))}
								/>
							</div>
						</div>

						{/* Print Sheet Size selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.sheetLabel}</label>
							<select
								class="input w-full"
								value={sheetSize}
								onChange={(e) => setSheetSize((e.target as HTMLSelectElement).value as SheetKey)}
							>
								{Object.entries(SHEETS).map(([key, value]) => (
									<option key={key} value={key}>
										{lang === "vi" ? value.labelVi : value.labelEn}
									</option>
								))}
							</select>
						</div>

						{/* Actions */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={processPhotos}>
									{t.processBtn}
								</button>
								<button class="btn-secondary w-full py-2.5" onClick={handleReset}>
									{t.reset}
								</button>
							</div>
						)}

						{status === "processing" && (
							<div class="text-center py-4 space-y-2">
								<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						)}
					</div>

					{/* Right Panel: Previews */}
					<div class="lg:col-span-7 space-y-6">
						{/* Single Photo Preview */}
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.previewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-4 rounded-lg border border-hairline overflow-hidden">
								<canvas
									ref={canvasRef}
									onClick={handleCanvasClick}
									class={`object-contain rounded shadow bg-surface-soft border border-hairline ${
										replaceBg ? "cursor-crosshair" : ""
									}`}
									style={{
										width: `${PRESETS[preset].width / 2}px`,
										height: `${PRESETS[preset].height / 2}px`,
									}}
								/>
							</div>

							{status === "done" && singlePhotoUrl && (
								<button
									class="btn-primary w-full mt-4 py-2.5 flex items-center justify-center gap-2"
									onClick={handleDownloadSingle}
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
									{t.downloadSingle}
								</button>
							)}
						</div>

						{/* Print Sheet Preview */}
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.sheetPreviewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-4 rounded-lg border border-hairline overflow-hidden max-h-[450px]">
								<canvas
									ref={sheetCanvasRef}
									class="max-w-full max-h-[380px] object-contain rounded shadow bg-white"
								/>
							</div>

							{status === "done" && printSheetUrl && (
								<button
									class="btn-primary w-full mt-4 py-2.5 flex items-center justify-center gap-2"
									onClick={handleDownloadSheet}
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
									{t.downloadSheet}
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
