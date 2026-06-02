import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

export default function BgColorChanger() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
	const [imgNaturalHeight, setImgNaturalHeight] = useState(0);

	// Editor State
	const [mode, setMode] = useState<"transparent" | "chromakey">("transparent");
	const [targetBgColor, setTargetBgColor] = useState<string>("#ffffff");

	// Chroma Key Settings
	const [keyColor, setKeyColor] = useState<string>("#ffffff");
	const [tolerance, setTolerance] = useState<number>(30); // 0 to 150
	const [feather, setFeather] = useState<number>(10); // 0 to 50

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [resultUrl, setResultUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image Background Color Changer",
			modeLabel: "Background Detection Mode",
			modeTransparent: "Transparent Areas (PNG)",
			modeChroma: "Chroma Key (Solid Color Background)",
			targetBg: "New Background Color",
			keyColor: "Color to Replace",
			tolerance: "Color Tolerance",
			feather: "Edge Feathering",
			processBtn: "Apply Background Color",
			download: "Download Image",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to change background",
			dropzoneSub: "Supports JPG, PNG, WebP",
			colorPickerTip: "Choose the exact color of the background you want to replace.",
			previewTitle: "Result Preview",
		},
		vi: {
			title: "Thay đổi màu nền hình ảnh",
			modeLabel: "Chế độ nhận diện nền",
			modeTransparent: "Vùng trong suốt (Ảnh PNG)",
			modeChroma: "Chroma Key (Nền màu đặc)",
			targetBg: "Màu nền mới",
			keyColor: "Màu nền cũ cần xóa",
			tolerance: "Độ lệch màu (Tolerance)",
			feather: "Làm mềm viền (Feather)",
			processBtn: "Áp dụng màu nền mới",
			download: "Tải ảnh về máy",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để đổi màu nền",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP",
			colorPickerTip: "Chọn mã màu của phông nền cũ bạn muốn thay thế.",
			previewTitle: "Hình ảnh kết quả",
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
			if (resultUrl) URL.revokeObjectURL(resultUrl);
		};
	}, [previewUrl, resultUrl]);

	const handleFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (resultUrl) URL.revokeObjectURL(resultUrl);

			setFile(f);
			setResultUrl(null);
			setStatus("idle");

			const url = URL.createObjectURL(f);
			setPreviewUrl(url);

			const tempImg = new Image();
			tempImg.onload = () => {
				setImgNaturalWidth(tempImg.naturalWidth);
				setImgNaturalHeight(tempImg.naturalHeight);
				// Auto detect background type
				if (f.type === "image/png" || f.type === "image/webp") {
					setMode("transparent");
				} else {
					setMode("chromakey");
				}
			};
			tempImg.src = url;
		},
		[previewUrl, resultUrl],
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

	// Draw and process background change
	const processImage = () => {
		if (!previewUrl) return;
		setStatus("processing");

		setTimeout(() => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = canvasRef.current;
					if (!canvas) return;
					const ctx = canvas.getContext("2d");
					if (!ctx) return;

					const W = imgNaturalWidth;
					const H = imgNaturalHeight;
					canvas.width = W;
					canvas.height = H;

					const targetColor = hexToRgb(targetBgColor);

					if (mode === "transparent") {
						// 1. Transparent Mode
						// Fill background color
						ctx.fillStyle = targetBgColor;
						ctx.fillRect(0, 0, W, H);
						// Draw transparent image over it
						ctx.drawImage(img, 0, 0);
					} else {
						// 2. Chroma Key Mode
						ctx.drawImage(img, 0, 0);
						const imgData = ctx.getImageData(0, 0, W, H);
						const data = imgData.data;

						const key = hexToRgb(keyColor);

						// Loop through all pixels
						for (let i = 0; i < data.length; i += 4) {
							const r = data[i];
							const g = data[i + 1];
							const b = data[i + 2];
							const a = data[i + 3];

							// Calculate Euclidean distance in RGB space
							const distance = Math.sqrt((r - key.r) ** 2 + (g - key.g) ** 2 + (b - key.b) ** 2);

							if (distance < tolerance) {
								// Interpolate alpha based on feathering
								let alphaFactor = 0;
								if (tolerance - feather > 0 && distance > tolerance - feather) {
									alphaFactor = (distance - (tolerance - feather)) / feather;
								}

								// Blend original pixel with target background color
								data[i] = Math.round(r * alphaFactor + targetColor.r * (1 - alphaFactor));
								data[i + 1] = Math.round(g * alphaFactor + targetColor.g * (1 - alphaFactor));
								data[i + 2] = Math.round(b * alphaFactor + targetColor.b * (1 - alphaFactor));
								// Keep fully opaque
								data[i + 3] = 255;
							}
						}

						ctx.putImageData(imgData, 0, 0);
					}

					canvas.toBlob((blob) => {
						if (blob) {
							if (resultUrl) URL.revokeObjectURL(resultUrl);
							setResultUrl(URL.createObjectURL(blob));
							setStatus("done");
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
		}, 50);
	};

	const handleDownload = () => {
		if (!resultUrl) return;
		const a = document.createElement("a");
		a.href = resultUrl;
		a.download = `bg-changed-${file?.name || "image.png"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		setFile(null);
		setPreviewUrl(null);
		setResultUrl(null);
		setStatus("idle");
	};

	// Extract key color on mouse click/touch on canvas (Eyedropper effect)
	const handleCanvasClick = (e: MouseEvent) => {
		if (mode !== "chromakey" || status === "processing") return;
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
		const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
			.toString(16)
			.slice(1)}`;

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
					{/* Left Panel: Editor Config */}
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
								<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
								<line x1="12" y1="9" x2="12" y2="13" />
								<line x1="12" y1="17" x2="12.01" y2="17" />
							</svg>
							Background Editor
						</h3>

						{/* Detection Mode selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.modeLabel}</label>
							<div class="grid grid-cols-2 gap-2">
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										mode === "transparent"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setMode("transparent")}
								>
									{t.modeTransparent}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										mode === "chromakey"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setMode("chromakey")}
								>
									{t.modeChroma}
								</button>
							</div>
						</div>

						{/* New Background Color */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.targetBg}</label>
							<div class="flex gap-2 items-center">
								<input
									type="color"
									class="w-10 h-10 rounded border border-hairline cursor-pointer"
									value={targetBgColor}
									onInput={(e) => setTargetBgColor((e.target as HTMLInputElement).value)}
								/>
								<span class="text-body-sm uppercase font-mono">{targetBgColor}</span>
							</div>
						</div>

						{/* Chroma Key Settings */}
						{mode === "chromakey" && (
							<div class="space-y-4 bg-surface-soft p-4 rounded-lg border border-hairline">
								<div>
									<label class="text-xs text-muted block mb-2">{t.keyColor}</label>
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

								{/* Tolerance */}
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.tolerance} ({tolerance})
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

								{/* Feather */}
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.feather} ({feather}px)
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

						{/* Actions */}
						{status !== "processing" && (
							<div class="space-y-2 pt-2">
								<button class="btn-primary w-full py-2.5" onClick={processImage}>
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

					{/* Right Panel: Preview Area */}
					<div class="lg:col-span-7 space-y-6">
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-3 mb-4">
								{t.previewTitle}
							</h3>

							<div class="flex justify-center bg-stone p-2 rounded-lg border border-hairline overflow-hidden max-h-[450px]">
								{/* Click canvas to pick key color */}
								<canvas
									ref={canvasRef}
									onClick={handleCanvasClick}
									class={`max-w-full max-h-[400px] object-contain rounded bg-surface-soft ${
										mode === "chromakey" && status !== "processing" ? "cursor-crosshair" : ""
									}`}
								/>
							</div>

							{status === "done" && resultUrl && (
								<button
									class="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2"
									onClick={handleDownload}
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
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
