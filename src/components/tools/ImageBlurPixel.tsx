import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

export default function ImageBlurPixel() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Image State
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
	const [imgNaturalHeight, setImgNaturalHeight] = useState(0);

	// Editor State
	const [mode, setMode] = useState<"blur" | "pixelate">("blur");
	const [blurRadius, setBlurRadius] = useState<number>(10); // 1 to 50
	const [pixelSize, setPixelSize] = useState<number>(10); // 2 to 100

	const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [resultUrl, setResultUrl] = useState<string | null>(null);

	const t = {
		en: {
			title: "Image Blur & Pixelate Tool",
			modeLabel: "Effect Mode",
			modeBlur: "Blur",
			modePixelate: "Pixelate",
			blurRadius: "Blur Radius",
			pixelSize: "Pixel Size",
			processBtn: "Apply Effect",
			download: "Download Image",
			reset: "Choose Another Image",
			dropzoneLabel: "Drop image to apply blur or pixelate effect",
			dropzoneSub: "Supports JPG, PNG, WebP",
			previewTitle: "Result Preview",
		},
		vi: {
			title: "Công cụ làm mờ & Pixel hóa ảnh",
			modeLabel: "Chế độ hiệu ứng",
			modeBlur: "Làm mờ (Blur)",
			modePixelate: "Pixel hóa (Pixelate)",
			blurRadius: "Bán kính mờ (Blur Radius)",
			pixelSize: "Kích cỡ Pixel (Pixel Size)",
			processBtn: "Áp dụng hiệu ứng",
			download: "Tải ảnh về máy",
			reset: "Chọn ảnh khác",
			dropzoneLabel: "Thả hình ảnh vào đây để làm mờ hoặc pixel hóa",
			dropzoneSub: "Hỗ trợ định dạng JPG, PNG, WebP",
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
				// Render original to canvas on load
				setTimeout(() => {
					const canvas = canvasRef.current;
					if (canvas) {
						canvas.width = tempImg.naturalWidth;
						canvas.height = tempImg.naturalHeight;
						const ctx = canvas.getContext("2d");
						if (ctx) {
							ctx.drawImage(tempImg, 0, 0);
						}
					}
				}, 50);
			};
			tempImg.src = url;
		},
		[previewUrl, resultUrl],
	);

	const boxBlurSliding = (imageData: ImageData, radius: number) => {
		const data = imageData.data;
		const w = imageData.width;
		const h = imageData.height;
		const temp = new Uint8ClampedArray(data.length);

		// Horizontal blur pass
		for (let y = 0; y < h; y++) {
			let rSum = 0;
			let gSum = 0;
			let bSum = 0;
			let aSum = 0;
			for (let x = -radius; x <= radius; x++) {
				const nx = Math.min(Math.max(x, 0), w - 1);
				const idx = (y * w + nx) * 4;
				rSum += data[idx];
				gSum += data[idx + 1];
				bSum += data[idx + 2];
				aSum += data[idx + 3];
			}
			for (let x = 0; x < w; x++) {
				const destIdx = (y * w + x) * 4;
				temp[destIdx] = rSum / (2 * radius + 1);
				temp[destIdx + 1] = gSum / (2 * radius + 1);
				temp[destIdx + 2] = bSum / (2 * radius + 1);
				temp[destIdx + 3] = aSum / (2 * radius + 1);

				const prevX = Math.min(Math.max(x - radius, 0), w - 1);
				const nextX = Math.min(Math.max(x + radius + 1, 0), w - 1);
				const prevIdx = (y * w + prevX) * 4;
				const nextIdx = (y * w + nextX) * 4;
				rSum += data[nextIdx] - data[prevIdx];
				gSum += data[nextIdx + 1] - data[prevIdx + 1];
				bSum += data[nextIdx + 2] - data[prevIdx + 2];
				aSum += data[nextIdx + 3] - data[prevIdx + 3];
			}
		}

		// Vertical blur pass
		for (let x = 0; x < w; x++) {
			let rSum = 0;
			let gSum = 0;
			let bSum = 0;
			let aSum = 0;
			for (let y = -radius; y <= radius; y++) {
				const ny = Math.min(Math.max(y, 0), h - 1);
				const idx = (ny * w + x) * 4;
				rSum += temp[idx];
				gSum += temp[idx + 1];
				bSum += temp[idx + 2];
				aSum += temp[idx + 3];
			}
			for (let y = 0; y < h; y++) {
				const destIdx = (y * w + x) * 4;
				data[destIdx] = rSum / (2 * radius + 1);
				data[destIdx + 1] = gSum / (2 * radius + 1);
				data[destIdx + 2] = bSum / (2 * radius + 1);
				data[destIdx + 3] = aSum / (2 * radius + 1);

				const prevY = Math.min(Math.max(y - radius, 0), h - 1);
				const nextY = Math.min(Math.max(y + radius + 1, 0), h - 1);
				const prevIdx = (prevY * w + x) * 4;
				const nextIdx = (nextY * w + x) * 4;
				rSum += temp[nextIdx] - temp[prevIdx];
				gSum += temp[nextIdx + 1] - temp[prevIdx + 1];
				bSum += temp[nextIdx + 2] - temp[prevIdx + 2];
				aSum += temp[nextIdx + 3] - temp[prevIdx + 3];
			}
		}
	};

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

					if (mode === "blur") {
						// Render original to canvas
						ctx.drawImage(img, 0, 0);
						const imgData = ctx.getImageData(0, 0, W, H);
						// Apply box blur
						boxBlurSliding(imgData, blurRadius);
						ctx.putImageData(imgData, 0, 0);
					} else {
						// Pixelate
						const size = pixelSize;
						const sw = Math.max(1, Math.round(W / size));
						const sh = Math.max(1, Math.round(H / size));

						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = sw;
						tempCanvas.height = sh;
						const tempCtx = tempCanvas.getContext("2d");
						if (tempCtx) {
							tempCtx.drawImage(img, 0, 0, sw, sh);
							ctx.imageSmoothingEnabled = false;
							ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, W, H);
						}
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
		a.download = `${mode}-${file?.name || "image.png"}`;
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
								<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
								<path d="M12 6v6l4 2" />
							</svg>
							Effect Configuration
						</h3>

						{/* Effect Mode selection */}
						<div>
							<label class="text-body-sm-strong text-ink block mb-2">{t.modeLabel}</label>
							<div class="grid grid-cols-2 gap-2">
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										mode === "blur"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setMode("blur")}
								>
									{t.modeBlur}
								</button>
								<button
									class={`py-2 px-3 rounded-full text-caption font-bold border transition-colors ${
										mode === "pixelate"
											? "bg-primary border-primary text-white"
											: "bg-surface-soft border-hairline text-ink hover:border-primary"
									}`}
									onClick={() => setMode("pixelate")}
								>
									{t.modePixelate}
								</button>
							</div>
						</div>

						{/* Effect Settings */}
						<div class="space-y-4 bg-surface-soft p-4 rounded-lg border border-hairline">
							{mode === "blur" ? (
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.blurRadius} ({blurRadius}px)
									</label>
									<input
										type="range"
										min="1"
										max="50"
										class="w-full accent-primary"
										value={blurRadius}
										onInput={(e) =>
											setBlurRadius(Number.parseInt((e.target as HTMLInputElement).value))
										}
									/>
								</div>
							) : (
								<div>
									<label class="text-xs text-muted block mb-1">
										{t.pixelSize} ({pixelSize}px)
									</label>
									<input
										type="range"
										min="2"
										max="100"
										class="w-full accent-primary"
										value={pixelSize}
										onInput={(e) =>
											setPixelSize(Number.parseInt((e.target as HTMLInputElement).value))
										}
									/>
								</div>
							)}
						</div>

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
								<canvas
									ref={canvasRef}
									class="max-w-full max-h-[400px] object-contain rounded bg-surface-soft"
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
